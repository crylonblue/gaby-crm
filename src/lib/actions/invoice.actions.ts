"use server";

import { db } from "@/db";
import { invoices, NewInvoice, Invoice, customerBudgets, customers } from "@/db/schema";
import { desc, eq, and, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateInvoicePDF } from "../../../lib/pdf-generator";
import { uploadToS3, uploadXRechnungXmlToS3 } from "../../../lib/s3";
import { generateXRechnungXML } from "../../../lib/zugferd-generator";
import { generateInvoiceNumber, mapDbInvoiceToInvoice } from "../invoice-helpers";
import { calculateInvoiceGrossAmount } from "../invoice-utils";

async function upsertCustomerBudgetAmount(params: { customerId: number; year: number; amount: number }) {
    const existingBudget = await db.select().from(customerBudgets).where(
        and(
            eq(customerBudgets.customerId, params.customerId),
            eq(customerBudgets.year, params.year)
        )
    );

    if (existingBudget.length > 0) {
        await db.update(customerBudgets)
            .set({ amount: params.amount })
            .where(eq(customerBudgets.id, existingBudget[0]!.id));
        return;
    }

    await db.insert(customerBudgets).values({
        customerId: params.customerId,
        year: params.year,
        amount: params.amount,
    });
}

async function recalcCustomerBudgetFromInvoices(params: { customerId: number; year: number }) {
    const pattern = `${params.year}-%`;
    // Budget consists of ALL created invoices for the year (not only the ones that were sent).
    const invs = await db.select().from(invoices).where(
        and(
            eq(invoices.customerId, params.customerId),
            like(invoices.date, pattern)
        )
    );

    const total = invs.reduce((acc, inv) => acc + calculateInvoiceGrossAmount(inv), 0);
    await upsertCustomerBudgetAmount({ customerId: params.customerId, year: params.year, amount: total });
}

export async function getInvoicesForCustomer(customerId: number) {
    try {
        const result = await db
            .select()
            .from(invoices)
            .where(eq(invoices.customerId, customerId))
            .orderBy(desc(invoices.date));
        return result;
    } catch (error) {
        console.error("Error fetching invoices for customer:", error);
        return [];
    }
}

export async function createInvoice(data: NewInvoice) {
    let invoiceId: number | null = null;
    
    try {
        // Generate invoice number if not provided
        const invoiceNumber = data.invoiceNumber || await generateInvoiceNumber(data.date);

        // Insert invoice with invoice number
        const invoiceData = {
            ...data,
            invoiceNumber,
        };
        await db.insert(invoices).values(invoiceData);

        // Get the inserted invoice ID by querying with the unique data
        // We use createdAt as it's unique and set at insertion time
        const insertedInvoice = await db.select({ id: invoices.id })
            .from(invoices)
            .where(eq(invoices.createdAt, data.createdAt))
            .orderBy(desc(invoices.id))
            .limit(1);

        invoiceId = insertedInvoice[0]?.id;
        
        if (!invoiceId) {
            console.error("Failed to get invoice ID after insertion");
            throw new Error("Failed to get invoice ID after insertion");
        }

        console.log("Invoice created with ID:", invoiceId);

        const year = new Date(data.date).getFullYear();
        await recalcCustomerBudgetFromInvoices({ customerId: data.customerId, year });

        // Generate PDF and upload to S3 - REQUIRED
        // Skip only if explicitly disabled via env var (for testing)
        const skipS3Upload = process.env.SKIP_S3_UPLOAD === 'true';
        
        if (skipS3Upload) {
            console.log("S3 upload skipped (SKIP_S3_UPLOAD=true)");
            revalidatePath("/invoices");
            return { success: true };
        }

        // Get the full invoice from database
        const fullInvoice = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
        
        if (fullInvoice.length === 0) {
            throw new Error("Invoice not found after creation");
        }

                // Map database invoice to PDF generator format
                const invoiceForPdf = await mapDbInvoiceToInvoice(fullInvoice[0], invoiceNumber);

        // Generate PDF - this will throw if it fails
        console.log("Generating PDF for invoice:", invoiceNumber);
        const pdfBuffer = await generateInvoicePDF(invoiceForPdf, 'de');

        // Upload to S3 - this will throw if it fails
        const userId = "default"; // You might want to get this from session/auth
        const fileName = `invoice-${invoiceNumber}.pdf`;
        const pdfUrl = await uploadToS3(
            userId,
            invoiceId.toString(),
            fileName,
            pdfBuffer,
            "application/pdf"
        );

        console.log("PDF generated and uploaded:", pdfUrl);

        // Generate and upload XRechnung XML
        let xrechnungXmlUrl: string | null = null;
        try {
            console.log("Generating XRechnung XML for invoice:", invoiceNumber);
            const xmlContent = await generateXRechnungXML(invoiceForPdf);
            xrechnungXmlUrl = await uploadXRechnungXmlToS3(
                userId,
                invoiceId.toString(),
                xmlContent
            );
            console.log("XRechnung XML generated and uploaded:", xrechnungXmlUrl);
        } catch (xmlError) {
            // Log but don't fail - XRechnung XML is optional
            console.error("Error generating XRechnung XML (continuing without it):", xmlError);
        }

        // Update invoice with PDF URL and XRechnung XML URL
        await db.update(invoices)
            .set({ 
                invoicePdfUrl: pdfUrl,
                xrechnungXmlUrl: xrechnungXmlUrl,
            })
            .where(eq(invoices.id, invoiceId));

        revalidatePath("/invoices");
        return { success: true };
    } catch (error: unknown) {
        console.error("Error creating invoice:", error);
        
        // Rollback: Delete invoice and revert budget if they were created
        if (invoiceId) {
            try {
                await db.delete(invoices).where(eq(invoices.id, invoiceId));
                console.log("Rolled back invoice creation due to PDF/S3 error");
            } catch (rollbackError) {
                console.error("Error rolling back invoice:", rollbackError);
            }
        }

        // Budget is derived from invoices; after rollback just recalc.
        try {
            const year = new Date(data.date).getFullYear();
            await recalcCustomerBudgetFromInvoices({ customerId: data.customerId, year });
        } catch (rollbackBudgetError) {
            console.error("Error recalculating budget after rollback:", rollbackBudgetError);
        }

        // Return user-friendly error message
        let errorMessage = "Fehler beim Erstellen der Rechnung";
        
        if (typeof error === "object" && error !== null && "Code" in error && (error as { Code?: unknown }).Code === "AccessDenied") {
            errorMessage = "Fehler beim Hochladen der PDF-Datei. Bitte überprüfen Sie die S3-Konfiguration.";
        } else if (typeof error === "object" && error !== null && "message" in error && typeof (error as { message?: unknown }).message === "string") {
            // Check if it's an S3 error
            const msg = (error as { message: string }).message;
            if (msg.includes('Access Denied') || msg.includes('S3')) {
                errorMessage = "Fehler beim Hochladen der PDF-Datei. Bitte überprüfen Sie die S3-Konfiguration.";
            } else if (msg.includes('PDF') || msg.includes('generate')) {
                errorMessage = "Fehler beim Generieren der PDF-Datei. Bitte versuchen Sie es erneut.";
            } else {
                errorMessage = msg;
            }
        }

        return { success: false, error: errorMessage };
    }
}

export async function getInvoices() {
    try {
        const result = await db.select().from(invoices).orderBy(desc(invoices.date));
        return result;
    } catch (error) {
        console.error("Error fetching invoices:", error);
        return [];
    }
}

export async function getInvoice(id: number) {
    try {
        const result = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
        return result[0] ?? null;
    } catch (error) {
        console.error("Error fetching invoice:", error);
        return null;
    }
}

export async function updateInvoice(id: number, data: Partial<NewInvoice>) {
    try {
        const existing = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
        if (existing.length === 0) return { success: false, error: "Rechnung nicht gefunden" };

        const inv = existing[0]!;

        if (inv.status === "storniert") {
            return { success: false, error: "Stornierte Rechnungen können nicht bearbeitet werden." };
        }

        const oldYear = new Date(inv.date).getFullYear();
        const newDate = data.date ?? inv.date;
        const newYear = new Date(newDate).getFullYear();

        await db.update(invoices)
            .set({
                ...data,
                date: newDate,
            })
            .where(eq(invoices.id, id));

        // Re-generate PDF & XRechnung if enabled and invoice number exists (or can be generated)
        const skipS3Upload = process.env.SKIP_S3_UPLOAD === 'true';
        if (!skipS3Upload) {
            const refreshed = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
            const updatedInv = refreshed[0];
            if (updatedInv) {
                const invoiceNumber = updatedInv.invoiceNumber || await generateInvoiceNumber(updatedInv.date);
                if (!updatedInv.invoiceNumber) {
                    await db.update(invoices).set({ invoiceNumber }).where(eq(invoices.id, id));
                    updatedInv.invoiceNumber = invoiceNumber;
                }

                const invoiceForPdf = await mapDbInvoiceToInvoice(updatedInv, invoiceNumber);
                const pdfBuffer = await generateInvoicePDF(invoiceForPdf, 'de');

                const userId = "default";
                const fileName = `invoice-${invoiceNumber}.pdf`;
                const pdfUrl = await uploadToS3(
                    userId,
                    id.toString(),
                    fileName,
                    pdfBuffer,
                    "application/pdf"
                );

                let xrechnungXmlUrl: string | null = null;
                try {
                    const xmlContent = await generateXRechnungXML(invoiceForPdf);
                    xrechnungXmlUrl = await uploadXRechnungXmlToS3(
                        userId,
                        id.toString(),
                        xmlContent
                    );
                } catch (xmlError) {
                    console.error("Error generating XRechnung XML (continuing without it):", xmlError);
                }

                await db.update(invoices)
                    .set({
                        invoicePdfUrl: pdfUrl,
                        xrechnungXmlUrl,
                    })
                    .where(eq(invoices.id, id));
            }
        }

        // Budget is derived; always recalc after update (handles old bugs too)
        await recalcCustomerBudgetFromInvoices({ customerId: inv.customerId, year: oldYear });
        if (newYear !== oldYear) {
            await recalcCustomerBudgetFromInvoices({ customerId: inv.customerId, year: newYear });
        }

        revalidatePath("/invoices");
        revalidatePath(`/invoices/${id}/edit`);
        return { success: true };
    } catch (error) {
        console.error("Error updating invoice:", error);
        return { success: false, error: "Fehler beim Aktualisieren der Rechnung" };
    }
}

/**
 * Builds the line items for a Storno (reversal) invoice by negating the original positions,
 * so the Storno amounts cancel out the original. Returns a lineItemsJson string.
 */
function buildStornoLineItemsJson(original: Invoice): string {
    if (original.lineItemsJson) {
        try {
            const items = JSON.parse(original.lineItemsJson);
            if (Array.isArray(items) && items.length > 0) {
                return JSON.stringify(
                    items.map((item: { quantity: number; [key: string]: unknown }) => ({
                        ...item,
                        quantity: -Math.abs(Number(item.quantity) || 0),
                    }))
                );
            }
        } catch (error) {
            console.error("Error parsing lineItemsJson for Storno:", error);
        }
    }

    // Legacy fallback: reconstruct positions from hours/km and negate them.
    const items: Array<{ description: string; quantity: number; unit: string; unitPrice: number; vatRate: number }> = [];
    if (original.hours > 0) {
        items.push({ description: original.description, quantity: -original.hours, unit: "hour", unitPrice: original.ratePerHour, vatRate: 19 });
    }
    if (original.km > 0) {
        items.push({ description: "Fahrtkosten", quantity: -original.km, unit: "km", unitPrice: original.ratePerKm, vatRate: 19 });
    }
    if (items.length === 0) {
        items.push({ description: original.description, quantity: -1, unit: "piece", unitPrice: 0, vatRate: 19 });
    }
    return JSON.stringify(items);
}

/**
 * Cancels an invoice (Storno). Invoices are never deleted. Instead this creates a reversal
 * invoice with negative amounts (its own sequential number, PDF + XRechnung) and sets the
 * original invoice to status "storniert", linking the two. A storniert invoice is locked.
 */
export async function cancelInvoice(id: number) {
    let stornoId: number | null = null;
    try {
        const existingRows = await db.select().from(invoices).where(eq(invoices.id, id)).limit(1);
        if (existingRows.length === 0) return { success: false, error: "Rechnung nicht gefunden" };
        const original = existingRows[0]!;

        if (original.status === "storniert" || original.cancelledByInvoiceId || original.cancelsInvoiceId) {
            return { success: false, error: "Diese Rechnung ist bereits storniert und kann nicht erneut storniert werden." };
        }

        // The Storno is dated today (date of issuance) and gets its own sequential invoice number.
        const stornoDate = new Date().toISOString().split("T")[0];
        const stornoNumber = await generateInvoiceNumber(stornoDate);
        const createdAt = new Date().toISOString();
        const stornoDescription = `Storno zu Rechnung ${original.invoiceNumber ?? `#${original.id}`}`;

        const stornoData: NewInvoice = {
            customerId: original.customerId,
            status: "storniert",
            date: stornoDate,
            invoiceNumber: stornoNumber,
            // Customer snapshot copied from the original invoice
            lastName: original.lastName,
            firstName: original.firstName,
            healthInsurance: original.healthInsurance,
            healthInsuranceStreet: original.healthInsuranceStreet,
            healthInsuranceHouseNumber: original.healthInsuranceHouseNumber,
            healthInsurancePostalCode: original.healthInsurancePostalCode,
            healthInsuranceCity: original.healthInsuranceCity,
            healthInsuranceCountry: original.healthInsuranceCountry,
            insuranceNumber: original.insuranceNumber,
            healthInsuranceEmail: original.healthInsuranceEmail,
            birthDate: original.birthDate,
            careLevel: original.careLevel,
            street: original.street,
            houseNumber: original.houseNumber,
            postalCode: original.postalCode,
            city: original.city,
            invoiceEmail: original.invoiceEmail,
            // Reversal amounts (negated positions live in lineItemsJson)
            hours: 0,
            description: stornoDescription,
            ratePerHour: original.ratePerHour,
            km: 0,
            ratePerKm: original.ratePerKm,
            lineItemsJson: buildStornoLineItemsJson(original),
            createdAt,
            paid: false,
            queuedForSending: false,
            cancelsInvoiceId: original.id,
        };

        await db.insert(invoices).values(stornoData);
        const inserted = await db.select({ id: invoices.id })
            .from(invoices)
            .where(eq(invoices.createdAt, createdAt))
            .orderBy(desc(invoices.id))
            .limit(1);
        stornoId = inserted[0]?.id ?? null;
        if (!stornoId) throw new Error("Failed to get Storno invoice ID after insertion");

        // Generate PDF + XRechnung for the Storno and upload to S3 (unless explicitly skipped).
        const skipS3Upload = process.env.SKIP_S3_UPLOAD === "true";
        if (!skipS3Upload) {
            const stornoRows = await db.select().from(invoices).where(eq(invoices.id, stornoId)).limit(1);
            const stornoInvoice = stornoRows[0]!;
            const invoiceForPdf = await mapDbInvoiceToInvoice(stornoInvoice, stornoNumber);

            const pdfBuffer = await generateInvoicePDF(invoiceForPdf, "de");
            const userId = "default";
            const pdfUrl = await uploadToS3(userId, stornoId.toString(), `invoice-${stornoNumber}.pdf`, pdfBuffer, "application/pdf");

            let xrechnungXmlUrl: string | null = null;
            try {
                const xmlContent = await generateXRechnungXML(invoiceForPdf);
                xrechnungXmlUrl = await uploadXRechnungXmlToS3(userId, stornoId.toString(), xmlContent);
            } catch (xmlError) {
                console.error("Error generating XRechnung XML for Storno (continuing without it):", xmlError);
            }

            await db.update(invoices)
                .set({ invoicePdfUrl: pdfUrl, xrechnungXmlUrl })
                .where(eq(invoices.id, stornoId));
        }

        // Lock the original: mark as storniert and link it to its Storno.
        await db.update(invoices)
            .set({ status: "storniert", cancelledByInvoiceId: stornoId })
            .where(eq(invoices.id, original.id));

        // Budget is derived from all created invoices; recalc affected years (original + Storno may differ).
        const originalYear = new Date(original.date).getFullYear();
        const stornoYear = new Date(stornoDate).getFullYear();
        await recalcCustomerBudgetFromInvoices({ customerId: original.customerId, year: originalYear });
        if (stornoYear !== originalYear) {
            await recalcCustomerBudgetFromInvoices({ customerId: original.customerId, year: stornoYear });
        }

        revalidatePath("/invoices");
        revalidatePath(`/customers/${original.customerId}`);
        return { success: true, stornoInvoiceNumber: stornoNumber };
    } catch (error) {
        console.error("Error cancelling invoice:", error);
        // Roll back the Storno if it was created but a later step failed.
        if (stornoId) {
            try {
                await db.delete(invoices).where(eq(invoices.id, stornoId));
            } catch (rollbackError) {
                console.error("Error rolling back Storno invoice:", rollbackError);
            }
        }
        return { success: false, error: "Fehler beim Stornieren der Rechnung" };
    }
}

export async function getInvoiceCountForCustomer(customerId: number) {
    try {
        const result = await db
            .select({ count: invoices.id })
            .from(invoices)
            .where(eq(invoices.customerId, customerId));
        return result.length;
    } catch (error) {
        console.error("Error counting invoices:", error);
        return 0;
    }
}

export async function toggleInvoicePaid(id: number) {
    try {
        // Get current invoice status
        const invoice = await db.select({ 
            paid: invoices.paid,
            status: invoices.status 
        })
            .from(invoices)
            .where(eq(invoices.id, id))
            .limit(1);

        if (invoice.length === 0) {
            return { success: false, error: "Rechnung nicht gefunden" };
        }

        if (invoice[0].status === "storniert") {
            return { success: false, error: "Stornierte Rechnungen können nicht geändert werden." };
        }

        const currentPaid = invoice[0].paid;
        const newPaidStatus = !currentPaid;

        // Simple status: "offen" or "bezahlt"
        const newStatus = newPaidStatus ? "bezahlt" : "offen";

        await db.update(invoices)
            .set({ 
                paid: newPaidStatus,
                status: newStatus
            })
            .where(eq(invoices.id, id));

        revalidatePath("/invoices");
        return { success: true, paid: newPaidStatus };
    } catch (error) {
        console.error("Error toggling invoice paid status:", error);
        return { success: false, error: "Fehler beim Aktualisieren der Rechnung" };
    }
}

export async function sendInvoice(data: { 
    invoiceId: number; 
    email: string; 
    attachAbtretungserklaerung: boolean;
    emailSubject: string;
    emailBody: string;
}) {
    try {
        // Get the invoice to check if it exists
        const invoice = await db.select().from(invoices).where(eq(invoices.id, data.invoiceId)).limit(1);
        
        if (invoice.length === 0) {
            return { success: false, error: "Rechnung nicht gefunden" };
        }

        // A cancelled original invoice must not be re-sent (the Storno is the document to send instead).
        if (invoice[0].cancelledByInvoiceId) {
            return { success: false, error: "Eine stornierte Rechnung kann nicht versendet werden." };
        }

        // Get customer to get abtretungserklaerung URL if needed
        const customer = await db.select().from(customers).where(eq(customers.id, invoice[0].customerId)).limit(1);
        const customerData = customer[0];

        // Prepare update data
        const updateData: {
            queuedForSending: boolean;
            invoiceEmail: string;
            emailSubject: string;
            emailBody: string;
            abtretungserklaerungUrl?: string | null;
        } = {
            queuedForSending: true,
            invoiceEmail: data.email,
            emailSubject: data.emailSubject,
            emailBody: data.emailBody,
        };

        // Attach abtretungserklaerung URL if checkbox is checked and customer has one
        if (data.attachAbtretungserklaerung && customerData?.abtretungserklaerungUrl) {
            updateData.abtretungserklaerungUrl = customerData.abtretungserklaerungUrl;
        } else if (!data.attachAbtretungserklaerung) {
            // Clear it if checkbox is not checked
            updateData.abtretungserklaerungUrl = null;
        }

        // Update invoice: set queuedForSending to true, update invoiceEmail, email content, and optionally attach abtretungserklaerung
        await db.update(invoices)
            .set(updateData)
            .where(eq(invoices.id, data.invoiceId));

        // Call webhook after updating database
        try {
            await fetch("https://api.sexy/webhook/560f454e-034f-4c1f-b948-3b682fd8ca77", {
                method: "GET",
            });
        } catch (webhookError) {
            console.error("Error calling webhook:", webhookError);
            // We don't want to fail the invoice sending if the webhook fails
        }

        revalidatePath("/invoices");
        return { success: true };
    } catch (error) {
        console.error("Error sending invoice:", error);
        return { success: false, error: "Fehler beim Senden der Rechnung" };
    }
}

export async function getMonthlyTurnover() {
    try {
        const now = new Date();
        // Use Berlin time to determine the "current month" for the business
        const berlinDate = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
        const year = berlinDate.getFullYear();
        const month = String(berlinDate.getMonth() + 1).padStart(2, '0');
        const pattern = `${year}-${month}%`;

        const monthlyInvoices = await db.select().from(invoices)
            .where(like(invoices.date, pattern));

        const totalTurnover = monthlyInvoices.reduce((acc, invoice) => {
            const amount = calculateInvoiceGrossAmount(invoice);
            return acc + amount;
        }, 0);

        return totalTurnover;
    } catch (error) {
        console.error("Error calculating turnover:", error);
        return 0;
    }
}

"use server";

import { db } from "@/db";
import { invoices, NewInvoice, customerBudgets, customers } from "@/db/schema";
import { desc, eq, and, gte, lte, ne, sql, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { generateInvoicePDF } from "../../../lib/pdf-generator";
import { uploadToS3, uploadXRechnungXmlToS3 } from "../../../lib/s3";
import { generateXRechnungXML } from "../../../lib/zugferd-generator";
import { generateInvoiceNumber, mapDbInvoiceToInvoice } from "../invoice-helpers";
import { calculateInvoiceGrossAmount } from "../invoice-utils";

export async function createInvoice(data: NewInvoice) {
    let invoiceId: number | null = null;
    let budgetUpdated = false;
    let budgetId: number | null = null;
    
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

        // Update Customer Budget - use accurate calculation from line items if available
        const amount = calculateInvoiceGrossAmount(data);
        const year = new Date(data.date).getFullYear();

        const existingBudget = await db.select().from(customerBudgets).where(
            and(
                eq(customerBudgets.customerId, data.customerId),
                eq(customerBudgets.year, year)
            )
        );

        if (existingBudget.length > 0) {
            budgetId = existingBudget[0].id;
            await db.update(customerBudgets)
                .set({ amount: sql`${customerBudgets.amount} + ${amount}` })
                .where(eq(customerBudgets.id, budgetId));
            budgetUpdated = true;
        } else {
            const newBudget = await db.insert(customerBudgets).values({
                customerId: data.customerId,
                year: year,
                amount: amount,
            });
            budgetUpdated = true;
        }

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
    } catch (error: any) {
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

        if (budgetUpdated && data.customerId) {
            try {
                const amount = calculateInvoiceGrossAmount(data);
                const year = new Date(data.date).getFullYear();
                
                if (budgetId) {
                    // Revert budget update
                    await db.update(customerBudgets)
                        .set({ amount: sql`${customerBudgets.amount} - ${amount}` })
                        .where(eq(customerBudgets.id, budgetId));
                } else {
                    // Delete newly created budget
                    await db.delete(customerBudgets).where(
                        and(
                            eq(customerBudgets.customerId, data.customerId),
                            eq(customerBudgets.year, year)
                        )
                    );
                }
                console.log("Rolled back budget update due to PDF/S3 error");
            } catch (rollbackError) {
                console.error("Error rolling back budget:", rollbackError);
            }
        }

        // Return user-friendly error message
        let errorMessage = "Fehler beim Erstellen der Rechnung";
        
        if (error?.Code === 'AccessDenied') {
            errorMessage = "Fehler beim Hochladen der PDF-Datei. Bitte überprüfen Sie die S3-Konfiguration.";
        } else if (error?.message) {
            // Check if it's an S3 error
            if (error.message.includes('Access Denied') || error.message.includes('S3')) {
                errorMessage = "Fehler beim Hochladen der PDF-Datei. Bitte überprüfen Sie die S3-Konfiguration.";
            } else if (error.message.includes('PDF') || error.message.includes('generate')) {
                errorMessage = "Fehler beim Generieren der PDF-Datei. Bitte versuchen Sie es erneut.";
            } else {
                errorMessage = error.message;
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

export async function deleteInvoice(id: number) {
    try {
        const invoice = await db.select().from(invoices).where(eq(invoices.id, id));
        if (invoice.length === 0) return { success: false, error: "Rechnung nicht gefunden" };

        const inv = invoice[0];
        const amount = calculateInvoiceGrossAmount(inv);
        const year = new Date(inv.date).getFullYear();

        await db.delete(invoices).where(eq(invoices.id, id));

        // Decrement Budget
        await db.update(customerBudgets)
            .set({ amount: sql`${customerBudgets.amount} - ${amount}` })
            .where(
                and(
                    eq(customerBudgets.customerId, inv.customerId),
                    eq(customerBudgets.year, year)
                )
            );

        revalidatePath("/invoices");
        return { success: true };
    } catch (error) {
        console.error("Error deleting invoice:", error);
        return { success: false, error: "Fehler beim Löschen der Rechnung" };
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

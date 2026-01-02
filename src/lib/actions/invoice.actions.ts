"use server";

import { db } from "@/db";
import { invoices, NewInvoice, customerBudgets, customers } from "@/db/schema";
import { desc, eq, and, gte, lte, ne, sql, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createInvoice(data: NewInvoice) {
    try {
        // Insert invoice
        await db.insert(invoices).values(data);

        // Get the inserted invoice ID by querying with the unique data
        // We use createdAt as it's unique and set at insertion time
        const insertedInvoice = await db.select({ id: invoices.id })
            .from(invoices)
            .where(eq(invoices.createdAt, data.createdAt))
            .orderBy(desc(invoices.id))
            .limit(1);

        const invoiceId = insertedInvoice[0]?.id;
        
        if (!invoiceId) {
            console.error("Failed to get invoice ID after insertion");
            throw new Error("Failed to get invoice ID after insertion");
        }

        console.log("Invoice created with ID:", invoiceId);

        // Update Customer Budget
        const amount = ((data.hours * (data.ratePerHour ?? 0)) + ((data.km ?? 0) * (data.ratePerKm ?? 0))) * 1.19;
        const year = new Date(data.date).getFullYear();

        const existingBudget = await db.select().from(customerBudgets).where(
            and(
                eq(customerBudgets.customerId, data.customerId),
                eq(customerBudgets.year, year)
            )
        );

        if (existingBudget.length > 0) {
            await db.update(customerBudgets)
                .set({ amount: sql`${customerBudgets.amount} + ${amount}` })
                .where(eq(customerBudgets.id, existingBudget[0].id));
        } else {
            await db.insert(customerBudgets).values({
                customerId: data.customerId,
                year: year,
                amount: amount,
            });
        }

        // Call webhook and wait for response
        console.log("Calling webhook for invoice ID:", invoiceId);
        try {
            const webhookResponse = await fetch("https://api.sexy/webhook/9caeeaf5-fbac-46da-a231-ec93579880ea", {
                method: "GET",
            });
            
            if (!webhookResponse.ok) {
                console.error("Webhook returned error status:", webhookResponse.status, webhookResponse.statusText);
            } else {
                console.log("Webhook called successfully");
            }
        } catch (webhookError) {
            console.error("Error calling webhook:", webhookError);
            // We don't want to fail the invoice creation if the webhook fails
        }

        revalidatePath("/invoices");
        return { success: true };
    } catch (error) {
        console.error("Error creating invoice:", error);
        return { success: false, error: "Fehler beim Erstellen der Rechnung" };
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
        const amount = ((inv.hours * inv.ratePerHour) + (inv.km * inv.ratePerKm)) * 1.19;
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

export async function sendInvoice(data: { invoiceId: number; email: string; attachAbtretungserklaerung: boolean }) {
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
            abtretungserklaerungUrl?: string | null;
        } = {
            queuedForSending: true,
            invoiceEmail: data.email,
        };

        // Attach abtretungserklaerung URL if checkbox is checked and customer has one
        if (data.attachAbtretungserklaerung && customerData?.abtretungserklaerungUrl) {
            updateData.abtretungserklaerungUrl = customerData.abtretungserklaerungUrl;
        } else if (!data.attachAbtretungserklaerung) {
            // Clear it if checkbox is not checked
            updateData.abtretungserklaerungUrl = null;
        }

        // Update invoice: set queuedForSending to true, update invoiceEmail, and optionally attach abtretungserklaerung
        await db.update(invoices)
            .set(updateData)
            .where(eq(invoices.id, data.invoiceId));

        // Call webhook after updating database
        try {
            await fetch("https://api.sexy/webhook/df4fb98a-3f0a-4db1-8e3d-65aa4f71310c", {
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
            const amount = ((invoice.hours * invoice.ratePerHour) + (invoice.km * invoice.ratePerKm)) * 1.19;
            return acc + amount;
        }, 0);

        return totalTurnover;
    } catch (error) {
        console.error("Error calculating turnover:", error);
        return 0;
    }
}

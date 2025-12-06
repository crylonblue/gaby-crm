"use server";

import { db } from "@/db";
import { invoices, NewInvoice } from "@/db/schema";
import { desc, eq, and, gte, lte, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createInvoice(data: NewInvoice) {
    try {
        await db.insert(invoices).values(data);

        // Trigger webhook
        try {
            await fetch("https://api.sexy/webhook/9caeeaf5-fbac-46da-a231-ec93579880ea", {
                method: "GET",
            });
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
        await db.delete(invoices).where(eq(invoices.id, id));
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

export async function getMonthlyTurnover() {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        // End of month
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

        const monthlyInvoices = await db.select().from(invoices)
            .where(
                and(
                    gte(invoices.date, startOfMonth),
                    lte(invoices.date, endOfMonth),
                    // Optionally filter status? "sum of ALL invoices". 
                    // Usually we don't count "aborted".
                    ne(invoices.status, "aborted")
                )
            );

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

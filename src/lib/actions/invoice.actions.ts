"use server";

import { db } from "@/db";
import { invoices, NewInvoice, customerBudgets } from "@/db/schema";
import { desc, eq, and, gte, lte, ne, sql, like } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createInvoice(data: NewInvoice) {
    try {
        // Ensure sendEmailAutomatically defaults to true if not provided
        const invoiceData = {
            ...data,
            sendEmailAutomatically: data.sendEmailAutomatically ?? true,
        };
        
        await db.insert(invoices).values(invoiceData);

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


        // Trigger webhook only if email should be sent automatically
        if (invoiceData.sendEmailAutomatically !== false) {
            try {
                await fetch("https://api.sexy/webhook/9caeeaf5-fbac-46da-a231-ec93579880ea", {
                    method: "GET",
                });
            } catch (webhookError) {
                console.error("Error calling webhook:", webhookError);
                // We don't want to fail the invoice creation if the webhook fails
            }
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

export async function getMonthlyTurnover() {
    try {
        const now = new Date();
        // Use Berlin time to determine the "current month" for the business
        const berlinDate = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
        const year = berlinDate.getFullYear();
        const month = String(berlinDate.getMonth() + 1).padStart(2, '0');
        const pattern = `${year}-${month}%`;

        const monthlyInvoices = await db.select().from(invoices)
            .where(
                and(
                    like(invoices.date, pattern),
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

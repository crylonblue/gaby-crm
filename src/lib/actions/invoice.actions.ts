"use server";

import { db } from "@/db";
import { invoices, NewInvoice } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createInvoice(data: NewInvoice) {
    try {
        await db.insert(invoices).values(data);

        // Trigger webhook
        try {
            await fetch("https://api.sexy/webhook/9caeeaf5-fbac-46da-a231-ec93579880ea", {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
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

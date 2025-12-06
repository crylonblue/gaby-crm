"use server";

import { db } from "@/db";
import { customers, NewCustomer } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function getCustomers() {
    const data = await db.select().from(customers).orderBy(desc(customers.id));
    return data;
}

export async function getCustomer(id: number) {
    const data = await db.select().from(customers).where(eq(customers.id, id));
    return data[0];
}

export async function createCustomer(data: NewCustomer) {
    await db.insert(customers).values(data);
    revalidatePath("/customers");
}

export async function updateCustomer(id: number, data: Partial<NewCustomer>) {
    await db.update(customers).set(data).where(eq(customers.id, id));
    revalidatePath("/customers");
    revalidatePath(`/customers/${id}/edit`);
}

export async function deleteCustomer(id: number) {
    await db.delete(customers).where(eq(customers.id, id));
    revalidatePath("/customers");
}

export async function importCustomers(data: NewCustomer[]) {
    try {
        if (!data || data.length === 0) return { success: true, count: 0 };

        // SQLite has a limit on variables in a query (usually 999 or 32766), so for safety we can chunk it if needed.
        // But for a "small" import, direct insert is usually fine.

        await db.insert(customers).values(data);
        revalidatePath("/customers");
        return { success: true, count: data.length };
    } catch (error) {
        console.error("Import error:", error);
        return { success: false, error: "Failed to import customers. Check data format or duplicates." };
    }
}

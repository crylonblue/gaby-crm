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

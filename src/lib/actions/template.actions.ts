"use server";

import { db } from "@/db";
import { templates, NewTemplate } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

/**
 * Get all templates
 */
export async function getTemplates() {
    try {
        const result = await db.select().from(templates).orderBy(templates.name);
        return result;
    } catch (error) {
        console.error("Error fetching templates:", error);
        return [];
    }
}

/**
 * Get a single template by ID
 */
export async function getTemplate(id: number) {
    try {
        const result = await db.select().from(templates).where(eq(templates.id, id)).limit(1);
        return result[0] || null;
    } catch (error) {
        console.error("Error fetching template:", error);
        return null;
    }
}

/**
 * Create a new template
 */
export async function createTemplate(data: {
    name: string;
    description?: string;
    unit: string;
    unitPrice: number;
    defaultVatRate: number;
}) {
    try {
        const now = new Date().toISOString();
        const result = await db.insert(templates).values({
            name: data.name,
            description: data.description || null,
            unit: data.unit,
            unitPrice: data.unitPrice,
            defaultVatRate: data.defaultVatRate,
            createdAt: now,
            updatedAt: now,
        }).returning();

        revalidatePath("/invoices/new");
        return { success: true, template: result[0] };
    } catch (error) {
        console.error("Error creating template:", error);
        return { success: false, error: "Fehler beim Erstellen der Vorlage" };
    }
}

/**
 * Update a template
 */
export async function updateTemplate(id: number, data: {
    name?: string;
    description?: string;
    unit?: string;
    unitPrice?: number;
    defaultVatRate?: number;
}) {
    try {
        await db.update(templates)
            .set({
                ...data,
                updatedAt: new Date().toISOString(),
            })
            .where(eq(templates.id, id));

        revalidatePath("/invoices/new");
        return { success: true };
    } catch (error) {
        console.error("Error updating template:", error);
        return { success: false, error: "Fehler beim Aktualisieren der Vorlage" };
    }
}

/**
 * Delete a template
 */
export async function deleteTemplate(id: number) {
    try {
        await db.delete(templates).where(eq(templates.id, id));
        revalidatePath("/invoices/new");
        return { success: true };
    } catch (error) {
        console.error("Error deleting template:", error);
        return { success: false, error: "Fehler beim Löschen der Vorlage" };
    }
}

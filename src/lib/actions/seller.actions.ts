"use server";

import { db } from "@/db";
import { sellerSettings, NewSellerSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { uploadLogoToS3, deleteLogoFromS3 } from "../../../lib/s3";

/**
 * Get seller settings (there should only be one record)
 */
export async function getSellerSettings() {
    try {
        const settings = await db.select().from(sellerSettings).limit(1);
        return settings[0] || null;
    } catch (error) {
        console.error("Error fetching seller settings:", error);
        return null;
    }
}

/**
 * Update or create seller settings
 */
export async function updateSellerSettings(data: {
    name?: string;
    subHeadline?: string;
    street?: string;
    streetNumber?: string;
    postalCode?: string;
    city?: string;
    country?: string;
    phoneNumber?: string;
    email?: string;
    contactName?: string;
    contactPhone?: string;
    contactEmail?: string;
    taxNumber?: string;
    vatId?: string;
    court?: string;
    registerNumber?: string;
    managingDirector?: string;
    bankName?: string;
    iban?: string;
    bic?: string;
    logoUrl?: string;
    invoiceGreeting?: string;
}) {
    try {
        const existing = await db.select().from(sellerSettings).limit(1);
        const updatedAt = new Date().toISOString();

        if (existing.length > 0) {
            // Update existing settings
            await db.update(sellerSettings)
                .set({
                    ...data,
                    updatedAt,
                })
                .where(eq(sellerSettings.id, existing[0].id));
        } else {
            // Create new settings
            await db.insert(sellerSettings).values({
                name: data.name || "",
                subHeadline: data.subHeadline,
                street: data.street || "",
                streetNumber: data.streetNumber || "",
                postalCode: data.postalCode || "",
                city: data.city || "",
                country: data.country || "DE",
                phoneNumber: data.phoneNumber,
                email: data.email,
                contactName: data.contactName,
                contactPhone: data.contactPhone,
                contactEmail: data.contactEmail,
                taxNumber: data.taxNumber,
                vatId: data.vatId,
                court: data.court,
                registerNumber: data.registerNumber,
                managingDirector: data.managingDirector,
                bankName: data.bankName,
                iban: data.iban,
                bic: data.bic,
                logoUrl: data.logoUrl,
                invoiceGreeting: data.invoiceGreeting,
                updatedAt,
            });
        }

        revalidatePath("/settings");
        return { success: true };
    } catch (error) {
        console.error("Error updating seller settings:", error);
        return { success: false, error: "Fehler beim Speichern der Einstellungen" };
    }
}

/**
 * Upload logo and update settings
 */
export async function uploadLogo(formData: FormData) {
    try {
        const file = formData.get("file") as File;
        
        if (!file) {
            return { success: false, error: "Keine Datei hochgeladen" };
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            return { success: false, error: "Nur Bilddateien sind erlaubt" };
        }

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to S3
        const companyId = "seller"; // Use fixed ID for seller logo
        const logoUrl = await uploadLogoToS3(
            companyId,
            buffer,
            file.type
        );

        // Update settings with logo URL
        const existing = await db.select().from(sellerSettings).limit(1);
        const updatedAt = new Date().toISOString();

        if (existing.length > 0) {
            // Delete old logo if exists
            if (existing[0].logoUrl) {
                try {
                    await deleteLogoFromS3(companyId);
                } catch (error) {
                    console.warn("Could not delete old logo:", error);
                }
            }

            await db.update(sellerSettings)
                .set({ logoUrl, updatedAt })
                .where(eq(sellerSettings.id, existing[0].id));
        } else {
            // Create new settings with logo
            await db.insert(sellerSettings).values({
                name: "",
                street: "",
                streetNumber: "",
                postalCode: "",
                city: "",
                country: "DE",
                logoUrl,
                updatedAt,
            });
        }

        revalidatePath("/settings");
        return { success: true, logoUrl };
    } catch (error) {
        console.error("Error uploading logo:", error);
        return { success: false, error: "Fehler beim Hochladen des Logos" };
    }
}

/**
 * Delete logo
 */
export async function deleteLogo() {
    try {
        const existing = await db.select().from(sellerSettings).limit(1);
        
        if (existing.length === 0 || !existing[0].logoUrl) {
            return { success: false, error: "Kein Logo vorhanden" };
        }

        // Delete from S3
        const companyId = "seller";
        await deleteLogoFromS3(companyId);

        // Update settings
        await db.update(sellerSettings)
            .set({ logoUrl: null, updatedAt: new Date().toISOString() })
            .where(eq(sellerSettings.id, existing[0].id));

        revalidatePath("/settings");
        return { success: true };
    } catch (error) {
        console.error("Error deleting logo:", error);
        return { success: false, error: "Fehler beim Löschen des Logos" };
    }
}

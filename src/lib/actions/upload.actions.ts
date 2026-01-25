"use server";

import { uploadAbtretungserklaerungToS3 } from "../../../lib/s3";

export async function uploadFile(
    formData: FormData
): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const file = formData.get("file") as File;

        if (!file) {
            return { success: false, error: "No file uploaded" };
        }

        const webhookUrl = process.env.UPLOAD_WEBHOOK_URL;
        if (!webhookUrl) {
            console.error("UPLOAD_WEBHOOK_URL is not defined");
            return { success: false, error: "Upload configuration missing" };
        }

        // Forward the FormData directly to the webhook
        const response = await fetch(webhookUrl, {
            method: "POST",
            body: formData,
        });

        if (!response.ok) {
            console.error("Webhook upload failed:", response.status, response.statusText);
            return { success: false, error: "Upload to external service failed" };
        }

        // Assuming the webhook returns JSON with the URL
        const data = await response.json();
        const url = data.url; // Adjust based on actual response structure if known, assuming { url: "..." }

        if (!url) {
            console.error("Webhook response missing URL:", data);
            // Fallback or error if URL is expected
            return { success: false, error: "External service did not return a URL" };
        }

        return { success: true, url };
    } catch (error) {
        console.error("Upload error:", error);
        return { success: false, error: "Failed to upload file" };
    }
}

/**
 * Upload Abtretungserklärung directly to S3
 */
export async function uploadAbtretungserklaerung(
    formData: FormData,
    customerId: string
): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const file = formData.get("file") as File;

        if (!file) {
            return { success: false, error: "Keine Datei ausgewählt" };
        }

        // Validate file type
        const allowedTypes = ["application/pdf", "image/png", "image/jpeg", "image/jpg"];
        if (!allowedTypes.includes(file.type)) {
            return { success: false, error: "Nur PDF, PNG und JPG Dateien sind erlaubt" };
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            return { success: false, error: "Datei ist zu groß (max. 10MB)" };
        }

        // Convert File to Buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to S3
        const url = await uploadAbtretungserklaerungToS3(
            customerId,
            file.name,
            buffer,
            file.type
        );

        return { success: true, url };
    } catch (error: any) {
        console.error("Abtretungserklärung upload error:", error);
        
        // Provide helpful error message
        if (error?.Code === 'AccessDenied') {
            return { success: false, error: "Zugriff verweigert. Bitte S3-Konfiguration prüfen." };
        }
        
        return { success: false, error: "Fehler beim Hochladen der Datei" };
    }
}

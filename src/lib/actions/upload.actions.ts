"use server";

import fs from "fs";
import path from "path";
import { v4 as uuidv4 } from "uuid";

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

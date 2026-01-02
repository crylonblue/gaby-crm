import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, invoiceNumber, url, queuedForSending, action } = body;

        if (!id) {
            return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
        }

        // Get current invoice to preserve paid status
        const currentInvoice = await db.select({ status: invoices.status })
            .from(invoices)
            .where(eq(invoices.id, id))
            .limit(1);

        if (currentInvoice.length === 0) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        const currentStatus = currentInvoice[0].status || "offen";
        const isPaid = currentStatus === "bezahlt";
        // Preserve paid status - if already paid, keep it as "bezahlt", otherwise set to "offen"
        const newStatus = isPaid ? "bezahlt" : "offen";

        // Update invoice with provided data
        const updateData: {
            status: string;
            invoiceNumber?: string;
            invoicePdfUrl?: string;
            sentAt?: string;
            queuedForSending?: boolean;
        } = {
            status: newStatus,
        };

        if (invoiceNumber !== undefined) {
            updateData.invoiceNumber = invoiceNumber;
        }

        if (url !== undefined) {
            updateData.invoicePdfUrl = url;
        }

        // Handle action: if action is "invoice_sent", set sentAt to current timestamp and remove from queue
        if (action === "invoice_sent") {
            updateData.sentAt = new Date().toISOString();
            updateData.queuedForSending = false;
        }

        // Allow explicit queuedForSending override only if action is not "invoice_sent"
        if (queuedForSending !== undefined && action !== "invoice_sent") {
            updateData.queuedForSending = queuedForSending === true || queuedForSending === "true";
        }

        await db.update(invoices)
            .set(updateData)
            .where(eq(invoices.id, id));

        return NextResponse.json({ success: true, message: "Invoice updated" });

    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

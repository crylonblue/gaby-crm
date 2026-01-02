import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, invoiceNumber, url } = body;

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
        } = {
            status: newStatus,
        };

        if (invoiceNumber) {
            updateData.invoiceNumber = invoiceNumber;
        }

        if (url) {
            updateData.invoicePdfUrl = url;
            // If URL is provided, it means the invoice was sent
            updateData.sentAt = new Date().toISOString();
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

import { db } from "@/db";
import { invoices } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, id, invoiceNumber, url } = body;

        if (!id || !action) {
            return NextResponse.json({ error: "Missing required fields: id, action" }, { status: 400 });
        }

        // Get current invoice to preserve "_paid" suffix
        const currentInvoice = await db.select({ status: invoices.status })
            .from(invoices)
            .where(eq(invoices.id, id))
            .limit(1);

        if (currentInvoice.length === 0) {
            return NextResponse.json({ error: "Invoice not found" }, { status: 404 });
        }

        const currentStatus = currentInvoice[0].status || "";
        const isPaid = currentStatus.endsWith("_paid");
        const paidSuffix = isPaid ? "_paid" : "";

        if (action === "invoice_ready_for_delivery") {
            if (!invoiceNumber || !url) {
                return NextResponse.json({ error: "Missing fields for invoice_ready_for_delivery: invoiceNumber, url" }, { status: 400 });
            }

            await db.update(invoices)
                .set({
                    invoiceNumber,
                    invoicePdfUrl: url,
                    status: `in_delivery${paidSuffix}`
                })
                .where(eq(invoices.id, id));

            return NextResponse.json({ success: true, message: "Invoice updated to in_delivery" });

        } else if (action === "invoice_sent") {
            await db.update(invoices)
                .set({ 
                    status: `sent${paidSuffix}`, 
                    invoiceNumber 
                })
                .where(eq(invoices.id, id));

            return NextResponse.json({ success: true, message: "Invoice updated to sent" });

        } else if (action === "invoice_creation_finished") {
            await db.update(invoices)
                .set({ 
                    status: `sent${paidSuffix}`, 
                    invoiceNumber, 
                    invoicePdfUrl: url 
                })
                .where(eq(invoices.id, id));

            return NextResponse.json({ success: true, message: "Invoice updated to sent (creation finished)" });

        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

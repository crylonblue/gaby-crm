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

        if (action === "invoice_ready_for_delivery") {
            if (!invoiceNumber || !url) {
                return NextResponse.json({ error: "Missing fields for invoice_ready_for_delivery: invoiceNumber, url" }, { status: 400 });
            }

            await db.update(invoices)
                .set({
                    invoiceNumber,
                    invoicePdfUrl: url,
                    status: "in_delivery"
                })
                .where(eq(invoices.id, id));

            return NextResponse.json({ success: true, message: "Invoice updated to in_delivery" });

        } else if (action === "invoice_sent") {
            await db.update(invoices)
                .set({ status: "sent", invoiceNumber })
                .where(eq(invoices.id, id));

            return NextResponse.json({ success: true, message: "Invoice updated to sent" });

        } else if (action === "invoice_creation_finished") {
            await db.update(invoices)
                .set({ status: "sent", invoiceNumber, invoicePdfUrl: url })
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

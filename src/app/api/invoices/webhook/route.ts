import { db } from "@/db";
import { customerBudgets, invoices } from "@/db/schema";
import { and, eq, isNotNull, like } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { calculateInvoiceGrossAmount } from "@/lib/invoice-utils";

async function upsertCustomerBudgetAmount(params: { customerId: number; year: number; amount: number }) {
    const existingBudget = await db.select().from(customerBudgets).where(
        and(
            eq(customerBudgets.customerId, params.customerId),
            eq(customerBudgets.year, params.year)
        )
    );

    if (existingBudget.length > 0) {
        await db.update(customerBudgets)
            .set({ amount: params.amount })
            .where(eq(customerBudgets.id, existingBudget[0]!.id));
        return;
    }

    await db.insert(customerBudgets).values({
        customerId: params.customerId,
        year: params.year,
        amount: params.amount,
    });
}

async function recalcCustomerBudgetFromInvoices(params: { customerId: number; year: number }) {
    const pattern = `${params.year}-%`;
    const invs = await db.select().from(invoices).where(
        and(
            eq(invoices.customerId, params.customerId),
            like(invoices.date, pattern),
            isNotNull(invoices.sentAt)
        )
    );

    const total = invs.reduce((acc, inv) => acc + calculateInvoiceGrossAmount(inv), 0);
    await upsertCustomerBudgetAmount({ customerId: params.customerId, year: params.year, amount: total });
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, invoiceNumber, url, queuedForSending, action } = body;

        if (!id) {
            return NextResponse.json({ error: "Missing required field: id" }, { status: 400 });
        }

        // Get current invoice to preserve paid status and compute budget after updates
        const currentInvoice = await db.select({ status: invoices.status, customerId: invoices.customerId, date: invoices.date })
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

        // Keep derived "Abgerechnet" (customer budget) consistent after send/queue events.
        // We only count invoices that have actually been sent (sentAt not null).
        const year = new Date(currentInvoice[0]!.date).getFullYear();
        await recalcCustomerBudgetFromInvoices({ customerId: currentInvoice[0]!.customerId, year });

        return NextResponse.json({ success: true, message: "Invoice updated" });

    } catch (error) {
        console.error("Webhook Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

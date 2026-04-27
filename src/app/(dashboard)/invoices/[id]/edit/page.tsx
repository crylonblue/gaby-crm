import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { getCustomers } from "@/lib/actions/customer.actions";
import { getInvoice } from "@/lib/actions/invoice.actions";
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const invoiceId = Number(id);
    if (!Number.isFinite(invoiceId)) notFound();

    const [invoice, customers] = await Promise.all([
        getInvoice(invoiceId),
        getCustomers(),
    ]);

    if (!invoice) notFound();

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <BreadcrumbNav items={[
                { label: "Dashboard", href: "/" },
                { label: "Rechnungen", href: "/invoices" },
                { label: `Rechnung ${invoice.invoiceNumber || `#${invoice.id}`}`, href: "/invoices" },
                { label: "Bearbeiten" }
            ]} />
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Rechnung bearbeiten</h1>
                <p className="text-muted-foreground">Ändern Sie Positionen und erzeugen Sie die PDF neu.</p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-950 rounded-lg border shadow-sm">
                <InvoiceForm customers={customers} invoice={invoice} />
            </div>
        </div>
    );
}


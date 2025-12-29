import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { getCustomers } from "@/lib/actions/customer.actions";
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
    const customers = await getCustomers();

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <BreadcrumbNav items={[
                { label: "Dashboard", href: "/" },
                { label: "Rechnungen", href: "/invoices" },
                { label: "Neue Rechnung" }
            ]} />
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Rechnung erfassen</h1>
                <p className="text-muted-foreground">Senden Sie Rechnungsdaten an die Buchhaltung.</p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-950 rounded-lg border shadow-sm">
                <InvoiceForm customers={customers} />
            </div>
        </div>
    );
}

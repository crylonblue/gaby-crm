import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { getCustomers } from "@/lib/actions/customer.actions";
import { getSellerSettings } from "@/lib/actions/seller.actions";
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav";

export const dynamic = "force-dynamic";

export default async function NewInvoicePage() {
    const [customers, settings] = await Promise.all([getCustomers(), getSellerSettings()]);
    // 0% for Kleinunternehmer / § 4 Nr. 16; otherwise the regular 19% default.
    const defaultVatRate = settings?.taxMode && settings.taxMode !== "standard" ? 0 : 19;

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
                <InvoiceForm customers={customers} defaultVatRate={defaultVatRate} />
            </div>
        </div>
    );
}

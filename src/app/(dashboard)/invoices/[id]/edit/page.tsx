import { InvoiceForm } from "@/components/invoices/InvoiceForm";
import { getCustomers } from "@/lib/actions/customer.actions";
import { getInvoice } from "@/lib/actions/invoice.actions";
import { getSellerSettings } from "@/lib/actions/seller.actions";
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav";
import { Button } from "@/components/ui/button";
import { Ban } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function EditInvoicePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const invoiceId = Number(id);
    if (!Number.isFinite(invoiceId)) notFound();

    const [invoice, customers, settings] = await Promise.all([
        getInvoice(invoiceId),
        getCustomers(),
        getSellerSettings(),
    ]);

    if (!invoice) notFound();

    // 0% for Kleinunternehmer / § 4 Nr. 16; otherwise the regular 19% default.
    const defaultVatRate = settings?.taxMode && settings.taxMode !== "standard" ? 0 : 19;

    const isCancelled = invoice.status === "storniert";
    const isSent = !isCancelled && invoice.sentAt != null;
    const isLocked = isCancelled || isSent;

    return (
        <div className="max-w-xl mx-auto space-y-6">
            <BreadcrumbNav items={[
                { label: "Dashboard", href: "/" },
                { label: "Rechnungen", href: "/invoices" },
                { label: `Rechnung ${invoice.invoiceNumber || `#${invoice.id}`}`, href: "/invoices" },
                { label: isLocked ? (isCancelled ? "Storniert" : "Versendet") : "Bearbeiten" }
            ]} />
            {isLocked ? (
                <>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                            {isCancelled ? "Rechnung storniert" : "Rechnung versendet"}
                        </h1>
                        <p className="text-muted-foreground">
                            {isCancelled
                                ? "Diese Rechnung wurde storniert und kann nicht bearbeitet werden."
                                : "Diese Rechnung wurde bereits versendet und kann nicht mehr bearbeitet werden."}
                        </p>
                    </div>
                    <div className="flex items-start gap-3 p-6 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-900">
                        <Ban className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
                        <div className="space-y-3">
                            <p className="text-sm text-red-700 dark:text-red-400">
                                {isCancelled
                                    ? "Stornierte Rechnungen sind unveränderlich. Für eine Korrektur wurde bereits eine Stornorechnung erstellt."
                                    : "Versendete Rechnungen sind unveränderlich. Für eine Korrektur stornieren Sie die Rechnung (in der Übersicht) und erstellen Sie eine neue, korrigierte Rechnung."}
                            </p>
                            <Button asChild variant="outline">
                                <Link href="/invoices">Zurück zur Übersicht</Link>
                            </Button>
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Rechnung bearbeiten</h1>
                        <p className="text-muted-foreground">Ändern Sie Positionen und erzeugen Sie die PDF neu.</p>
                    </div>
                    <div className="p-6 bg-white dark:bg-slate-950 rounded-lg border shadow-sm">
                        <InvoiceForm customers={customers} invoice={invoice} defaultVatRate={defaultVatRate} />
                    </div>
                </>
            )}
        </div>
    );
}


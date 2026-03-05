import { getInvoices } from "@/lib/actions/invoice.actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav";
import { InvoiceListWithSearch } from "@/components/invoices/InvoiceListWithSearch";

export const dynamic = "force-dynamic";

export default async function InvoicesPage() {
    const invoices = await getInvoices();

    return (
        <div className="space-y-6">
            <BreadcrumbNav items={[
                { label: "Dashboard", href: "/" },
                { label: "Rechnungen" }
            ]} />
            <div className="flex items-center justify-between">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Rechnungen</h1>
                <Button asChild>
                    <Link href="/invoices/new">
                        <Plus className="mr-2 h-4 w-4" /> Neue Rechnung
                    </Link>
                </Button>
            </div>

            <InvoiceListWithSearch invoices={invoices} />
        </div>
    );
}

import { CustomerForm } from "@/components/customers/CustomerForm";
import { getCustomer } from "@/lib/actions/customer.actions";
import { notFound } from "next/navigation";
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav";

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const customer = await getCustomer(parseInt(id));

    if (!customer) {
        notFound();
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <BreadcrumbNav items={[
                { label: "Dashboard", href: "/" },
                { label: "Kunden", href: "/customers" },
                { label: `${customer.lastName}, ${customer.firstName}`, href: `/customers/${id}` },
                { label: "Bearbeiten" }
            ]} />
            <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Kunde bearbeiten</h1>
                <p className="text-muted-foreground">Bearbeiten Sie die Daten von {customer.firstName} {customer.lastName}.</p>
            </div>
            <div className="p-6 bg-white dark:bg-slate-950 rounded-lg border shadow-sm">
                <CustomerForm customer={customer} />
            </div>
        </div>
    );
}

import { Button } from "@/components/ui/button";
import { getCustomers } from "@/lib/actions/customer.actions";
import Link from "next/link";
import { Plus } from "lucide-react";
import { FilteredCustomerList } from "@/components/customers/FilteredCustomerList";

export const dynamic = "force-dynamic";

export default async function CustomersPage() {
    const customers = await getCustomers();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Kunden</h1>
                <Button asChild>
                    <Link href="/customers/new">
                        <Plus className="mr-2 h-4 w-4" /> Kunde hinzufügen
                    </Link>
                </Button>
            </div>

            <FilteredCustomerList customers={customers} />
        </div>
    );
}

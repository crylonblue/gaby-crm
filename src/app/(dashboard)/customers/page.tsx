import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getCustomers } from "@/lib/actions/customer.actions";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CustomerRow } from "@/components/customers/CustomerRow";

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

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nachname</TableHead>
                            <TableHead>Vorname</TableHead>
                            <TableHead>Stadt</TableHead>
                            <TableHead>Telefon</TableHead>
                            <TableHead className="w-[100px]">Aktionen</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {customers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    Keine Kunden gefunden.
                                </TableCell>
                            </TableRow>
                        ) : (
                            customers.map((customer) => (
                                <CustomerRow key={customer.id} customer={customer} />
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

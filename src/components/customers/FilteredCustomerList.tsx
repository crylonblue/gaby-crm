"use client";

import { useState } from "react";
import { Customer } from "@/db/schema";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { CustomerRow } from "@/components/customers/CustomerRow";
import { Search } from "lucide-react";

interface FilteredCustomerListProps {
    customers: Customer[];
}

export function FilteredCustomerList({ customers }: FilteredCustomerListProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredCustomers = customers.filter((customer) => {
        const term = searchTerm.toLowerCase();
        return (
            customer.lastName.toLowerCase().includes(term) ||
            customer.firstName.toLowerCase().includes(term)
        );
    });

    return (
        <div className="space-y-4">
            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Suche nach Name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                />
            </div>

            <div className="rounded-md border overflow-x-auto">
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
                        {filteredCustomers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                    {searchTerm ? "Keine Kunden gefunden, die der Suche entsprechen." : "Keine Kunden vorhanden."}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <CustomerRow key={customer.id} customer={customer} />
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

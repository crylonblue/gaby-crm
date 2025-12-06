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

import { Search, Phone, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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

            {/* Desktop View */}
            <div className="hidden md:block rounded-md border overflow-x-auto w-full">
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

            {/* Mobile View */}
            <div className="grid gap-4 md:hidden">
                {filteredCustomers.length === 0 ? (
                    <div className="text-center p-8 border rounded-md text-muted-foreground">
                        {searchTerm ? "Keine Kunden gefunden." : "Keine Kunden vorhanden."}
                    </div>
                ) : (
                    filteredCustomers.map((customer) => (
                        <Card key={customer.id}>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-base font-medium">
                                    {customer.lastName}, {customer.firstName}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                {(customer.street || customer.city) && (
                                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                                        <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                                        <span>
                                            {customer.street} {customer.houseNumber}<br />
                                            {customer.postalCode} {customer.city}
                                        </span>
                                    </div>
                                )}
                                {(customer.mobilePhone || customer.landlinePhone) && (
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <Phone className="h-4 w-4 shrink-0" />
                                        <span>
                                            {customer.mobilePhone || customer.landlinePhone}
                                        </span>
                                    </div>
                                )}
                                <Button asChild variant="outline" size="sm" className="w-full mt-2">
                                    <Link href={`/customers/${customer.id}`}>
                                        Details anzeigen
                                    </Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}

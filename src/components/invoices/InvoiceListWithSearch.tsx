"use client";

import { useState } from "react";
import { Invoice } from "@/db/schema";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Check, Ban } from "lucide-react";
import { MobileInvoiceList } from "@/components/invoices/MobileInvoiceList";
import { InvoiceActionsMenu } from "@/components/invoices/InvoiceActionsMenu";
import { calculateInvoiceGrossAmount } from "@/lib/invoice-utils";

interface InvoiceListWithSearchProps {
    invoices: Invoice[];
}

export function InvoiceListWithSearch({ invoices }: InvoiceListWithSearchProps) {
    const [searchTerm, setSearchTerm] = useState("");

    const filteredInvoices = invoices.filter((invoice) => {
        const term = searchTerm.toLowerCase().trim();
        if (!term) return true;
        return (
            invoice.lastName.toLowerCase().includes(term) ||
            invoice.firstName.toLowerCase().includes(term)
        );
    });

    return (
        <div className="space-y-4">
            <div className="relative max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Suche nach Kunde..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Desktop View */}
            <Card className="hidden md:block py-0 overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto w-full">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Datum</TableHead>
                                    <TableHead>Kunde</TableHead>
                                    <TableHead>Rechnungs-Nr.</TableHead>
                                    <TableHead className="text-right">Betrag (Brutto)</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Gesendet am</TableHead>
                                    <TableHead className="w-[100px]"></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredInvoices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                            {searchTerm ? "Keine Rechnungen gefunden, die der Suche entsprechen." : "Keine Rechnungen vorhanden."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredInvoices.map((invoice) => {
                                        const amount = calculateInvoiceGrossAmount(invoice);

                                        return (
                                            <TableRow key={invoice.id}>
                                                <TableCell>
                                                    {new Date(invoice.date).toLocaleDateString("de-DE")}
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {invoice.lastName}, {invoice.firstName}
                                                </TableCell>
                                                <TableCell className="max-w-[200px] truncate">
                                                    {invoice.invoiceNumber}
                                                </TableCell>
                                                <TableCell className="text-right font-mono">
                                                    {amount.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                                                </TableCell>
                                                <TableCell>
                                                    {(() => {
                                                        const status = invoice.status || "offen";
                                                        if (status === "storniert") {
                                                            return (
                                                                <Badge
                                                                    variant="outline"
                                                                    className="border-red-600 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 dark:border-red-500"
                                                                >
                                                                    <div className="flex items-center gap-1">
                                                                        <Ban className="h-3 w-3" />
                                                                        Storniert
                                                                    </div>
                                                                </Badge>
                                                            );
                                                        }
                                                        const isPaid = status === "bezahlt";

                                                        return (
                                                            <Badge
                                                                variant={isPaid ? "outline" : "secondary"}
                                                                className={isPaid ? "border-green-600 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 dark:border-green-500" : ""}
                                                            >
                                                                {isPaid ? (
                                                                    <div className="flex items-center gap-1">
                                                                        <Check className="h-3 w-3" />
                                                                        Bezahlt
                                                                    </div>
                                                                ) : (
                                                                    "Offen"
                                                                )}
                                                            </Badge>
                                                        );
                                                    })()}
                                                </TableCell>
                                                <TableCell>
                                                    {invoice.sentAt ? (
                                                        new Date(invoice.sentAt).toLocaleDateString("de-DE", {
                                                            day: "2-digit",
                                                            month: "2-digit",
                                                            year: "numeric"
                                                        })
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <InvoiceActionsMenu invoice={invoice} />
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            {/* Mobile View */}
            <div className="md:hidden">
                <MobileInvoiceList
                    invoices={filteredInvoices}
                    emptyMessage={searchTerm ? "Keine Rechnungen gefunden, die der Suche entsprechen." : undefined}
                />
            </div>
        </div>
    );
}

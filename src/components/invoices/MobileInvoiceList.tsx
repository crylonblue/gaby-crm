"use client";

import { Invoice } from "@/db/schema";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Ban } from "lucide-react";
import { InvoiceActionsMenu } from "@/components/invoices/InvoiceActionsMenu";
import { calculateInvoiceGrossAmount } from "@/lib/invoice-utils";

interface MobileInvoiceListProps {
    invoices: Invoice[];
    emptyMessage?: string;
}

export function MobileInvoiceList({ invoices, emptyMessage = "Keine Rechnungen vorhanden." }: MobileInvoiceListProps) {
    if (invoices.length === 0) {
        return (
            <div className="text-center p-8 border rounded-md text-muted-foreground">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {invoices.map((invoice) => {
                const amount = calculateInvoiceGrossAmount(invoice);

                return (
                    <Card key={invoice.id}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-base font-medium">
                                    {invoice.lastName}, {invoice.firstName}
                                </CardTitle>
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
                            </div>
                            <div className="text-xs text-muted-foreground space-y-1 mt-2">
                                <div>
                                    <span className="font-medium">Rechnungsnummer:</span> {invoice.invoiceNumber || "Keine Nr."}
                                </div>
                                <div>
                                    <span className="font-medium">Erstellt am:</span> {new Date(invoice.createdAt).toLocaleDateString("de-DE", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "numeric"
                                    })}
                                </div>
                                {invoice.sentAt ? (
                                    <div>
                                        <span className="font-medium">Gesendet am:</span> {new Date(invoice.sentAt).toLocaleDateString("de-DE", {
                                            day: "2-digit",
                                            month: "2-digit",
                                            year: "numeric"
                                        })}
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground/70">
                                        <span className="font-medium">Gesendet am:</span> Noch nicht gesendet
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                            <div className="text-2xl font-bold">
                                {amount.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end pt-2">
                            <InvoiceActionsMenu invoice={invoice} />
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}

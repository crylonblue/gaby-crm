"use client";

import { Invoice } from "@/db/schema";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, FileText, Check } from "lucide-react";
import Link from "next/link";
import { DeleteInvoiceDialog } from "@/components/invoices/DeleteInvoiceDialog";
import { TogglePaidButton } from "@/components/invoices/TogglePaidButton";

interface MobileInvoiceListProps {
    invoices: Invoice[];
}

export function MobileInvoiceList({ invoices }: MobileInvoiceListProps) {
    if (invoices.length === 0) {
        return (
            <div className="text-center p-8 border rounded-md text-muted-foreground">
                Keine Rechnungen vorhanden.
            </div>
        );
    }

    return (
        <div className="grid gap-4">
            {invoices.map((invoice) => {
                const amount = ((invoice.hours * invoice.ratePerHour) + (invoice.km * invoice.ratePerKm)) * 1.19;

                return (
                    <Card key={invoice.id}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <CardTitle className="text-base font-medium">
                                    {invoice.lastName}, {invoice.firstName}
                                </CardTitle>
                                <Badge 
                                    variant={invoice.paid ? "outline" :
                                        invoice.status === "sent" ? "default" :
                                            invoice.status === "processing" ? "secondary" :
                                                invoice.status === "aborted" ? "destructive" : "outline"}
                                    className={invoice.paid ? "border-green-600 bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 dark:border-green-500" : ""}
                                >
                                    {invoice.paid ? (
                                        <div className="flex items-center gap-1">
                                            <Check className="h-3 w-3" />
                                            Bezahlt
                                        </div>
                                    ) : invoice.status === "sent" ? "Versendet" :
                                        invoice.status === "processing" ? (
                                            <div className="flex items-center gap-1">
                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                In Bearb.
                                            </div>
                                        ) :
                                            invoice.status === "in_delivery" ? (
                                                <div className="flex items-center gap-1">
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                    Zustellung
                                                </div>
                                            ) :
                                                invoice.status === "aborted" ? "Abgebr." : invoice.status}
                                </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                {invoice.invoiceNumber || "Keine Nr."} • {new Date(invoice.date).toLocaleDateString("de-DE")}
                            </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                            <div className="text-2xl font-bold">
                                {amount.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                            </div>
                        </CardContent>
                        <CardFooter className="flex justify-end gap-2 pt-2">
                            {invoice.invoicePdfUrl && (
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={invoice.invoicePdfUrl} target="_blank" rel="noopener noreferrer">
                                        <FileText className="h-4 w-4 mr-2" /> PDF
                                    </Link>
                                </Button>
                            )}
                            {invoice.status === "sent" && (
                                <TogglePaidButton invoiceId={invoice.id} paid={invoice.paid ?? false} />
                            )}
                            <DeleteInvoiceDialog id={invoice.id} invoiceNumber={invoice.invoiceNumber} />
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}

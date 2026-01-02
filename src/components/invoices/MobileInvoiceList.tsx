"use client";

import { Invoice } from "@/db/schema";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Check } from "lucide-react";
import Link from "next/link";
import { DeleteInvoiceDialog } from "@/components/invoices/DeleteInvoiceDialog";
import { TogglePaidButton } from "@/components/invoices/TogglePaidButton";
import { SendInvoiceDialog } from "@/components/invoices/SendInvoiceDialog";
import { getGoogleDriveViewerUrl } from "@/lib/utils";

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
                                {(() => {
                                    const status = invoice.status || "offen";
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
                        <CardFooter className="flex justify-end gap-2 pt-2">
                            {invoice.invoicePdfUrl && (
                                <Button variant="outline" size="sm" asChild className="border">
                                    <Link 
                                        href={getGoogleDriveViewerUrl(invoice.invoicePdfUrl)} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                    >
                                        <Eye className="h-4 w-4 mr-2" /> Anzeigen
                                    </Link>
                                </Button>
                            )}
                            <SendInvoiceDialog invoiceId={invoice.id} customerId={invoice.customerId} />
                            <TogglePaidButton invoiceId={invoice.id} paid={invoice.status === "bezahlt"} />
                            <DeleteInvoiceDialog id={invoice.id} invoiceNumber={invoice.invoiceNumber} />
                        </CardFooter>
                    </Card>
                );
            })}
        </div>
    );
}

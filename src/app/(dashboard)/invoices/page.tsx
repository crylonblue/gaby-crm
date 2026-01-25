import { getInvoices } from "@/lib/actions/invoice.actions";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Plus, Eye, Check, Send } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeleteInvoiceDialog } from "@/components/invoices/DeleteInvoiceDialog";
import { MobileInvoiceList } from "@/components/invoices/MobileInvoiceList";
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav";
import { TogglePaidButton } from "@/components/invoices/TogglePaidButton";
import { SendInvoiceDialog } from "@/components/invoices/SendInvoiceDialog";
import { getGoogleDriveViewerUrl } from "@/lib/utils";
import { calculateInvoiceGrossAmount } from "@/lib/invoice-utils";

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
                                {invoices.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                            Keine Rechnungen vorhanden.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    invoices.map((invoice) => {
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
                                                <TableCell className="flex justify-end gap-2">
                                                    {invoice.invoicePdfUrl && (
                                                        <Button 
                                                            variant="outline" 
                                                            size="icon" 
                                                            asChild
                                                            title="Rechnung in Drive anzeigen"
                                                        >
                                                            <Link 
                                                                href={getGoogleDriveViewerUrl(invoice.invoicePdfUrl)} 
                                                                target="_blank" 
                                                                rel="noopener noreferrer"
                                                            >
                                                                <Eye className="h-4 w-4 text-blue-600" />
                                                            </Link>
                                                        </Button>
                                                    )}
                                                    <SendInvoiceDialog 
                                                        invoiceId={invoice.id} 
                                                        customerId={invoice.customerId} 
                                                        invoiceNumber={invoice.invoiceNumber || undefined}
                                                        customerLastName={invoice.lastName}
                                                        insuranceNumber={invoice.insuranceNumber || undefined}
                                                    />
                                                    <TogglePaidButton invoiceId={invoice.id} paid={invoice.status === "bezahlt"} />
                                                    <DeleteInvoiceDialog id={invoice.id} invoiceNumber={invoice.invoiceNumber} />
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
                <MobileInvoiceList invoices={invoices} />
            </div>
        </div>
    );
}

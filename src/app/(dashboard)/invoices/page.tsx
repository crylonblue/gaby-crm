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
import Link from "next/link";
import { Plus, FileText, Loader2, Check } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeleteInvoiceDialog } from "@/components/invoices/DeleteInvoiceDialog";
import { MobileInvoiceList } from "@/components/invoices/MobileInvoiceList";
import { BreadcrumbNav } from "@/components/layout/BreadcrumbNav";
import { TogglePaidButton } from "@/components/invoices/TogglePaidButton";

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
            <div className="hidden md:block rounded-md border overflow-x-auto w-full">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Datum</TableHead>
                            <TableHead>Kunde</TableHead>
                            <TableHead>Rechnungs-Nr.</TableHead>
                            <TableHead className="text-right">Betrag (Brutto)</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                    Keine Rechnungen vorhanden.
                                </TableCell>
                            </TableRow>
                        ) : (
                            invoices.map((invoice) => {
                                const amount = ((invoice.hours * invoice.ratePerHour) + (invoice.km * invoice.ratePerKm)) * 1.19;

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
                                                            In Bearbeitung
                                                        </div>
                                                    ) :
                                                        invoice.status === "in_delivery" ? (
                                                            <div className="flex items-center gap-1">
                                                                <Loader2 className="h-3 w-3 animate-spin" />
                                                                In Zustellung
                                                            </div>
                                                        ) :
                                                            invoice.status === "aborted" ? "Abgebrochen" : invoice.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="flex justify-end gap-2">
                                            {invoice.invoicePdfUrl && (
                                                <Button variant="ghost" size="icon" asChild>
                                                    <Link href={invoice.invoicePdfUrl} target="_blank" rel="noopener noreferrer">
                                                        <FileText className="h-4 w-4 text-blue-600" />
                                                    </Link>
                                                </Button>
                                            )}
                                            {invoice.status === "sent" && (
                                                <TogglePaidButton invoiceId={invoice.id} paid={invoice.paid ?? false} />
                                            )}
                                            <DeleteInvoiceDialog id={invoice.id} invoiceNumber={invoice.invoiceNumber} />
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden">
                <MobileInvoiceList invoices={invoices} />
            </div>
        </div>
    );
}

"use client";

import { useState, useTransition } from "react";
import { MoreHorizontal, Eye, Pencil, Send, Check, X, Ban } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Invoice } from "@/db/schema";
import { toggleInvoicePaid } from "@/lib/actions/invoice.actions";
import { getGoogleDriveViewerUrl } from "@/lib/utils";
import { SendInvoiceDialog } from "@/components/invoices/SendInvoiceDialog";
import { CancelInvoiceDialog } from "@/components/invoices/CancelInvoiceDialog";

const itemClass =
    "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-left hover:bg-accent hover:text-accent-foreground cursor-pointer disabled:opacity-50 disabled:pointer-events-none";

export function InvoiceActionsMenu({ invoice }: { invoice: Invoice }) {
    const [menuOpen, setMenuOpen] = useState(false);
    const [sendOpen, setSendOpen] = useState(false);
    const [cancelOpen, setCancelOpen] = useState(false);
    const [isPending, startTransition] = useTransition();

    const status = invoice.status || "offen";
    const isLocked = status === "storniert";
    const isCancelledOriginal = invoice.cancelledByInvoiceId != null;
    const isEditable = !isLocked && !invoice.sentAt;
    const isPaid = status === "bezahlt";

    const handleTogglePaid = () => {
        setMenuOpen(false);
        startTransition(async () => {
            const result = await toggleInvoicePaid(invoice.id);
            if (result.success) {
                toast.success(result.paid ? "Als bezahlt markiert" : "Als unbezahlt markiert");
            } else {
                toast.error(result.error || "Fehler beim Aktualisieren");
            }
        });
    };

    return (
        <>
            <Popover open={menuOpen} onOpenChange={setMenuOpen}>
                <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" title="Aktionen">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56 p-1">
                    {invoice.invoicePdfUrl && (
                        <a
                            href={getGoogleDriveViewerUrl(invoice.invoicePdfUrl)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={itemClass}
                            onClick={() => setMenuOpen(false)}
                        >
                            <Eye className="h-4 w-4 text-blue-600" /> PDF anzeigen
                        </a>
                    )}
                    {isEditable && (
                        <Link
                            href={`/invoices/${invoice.id}/edit`}
                            className={itemClass}
                            onClick={() => setMenuOpen(false)}
                        >
                            <Pencil className="h-4 w-4" /> Bearbeiten
                        </Link>
                    )}
                    {!isCancelledOriginal && (
                        <button
                            type="button"
                            className={itemClass}
                            onClick={() => {
                                setMenuOpen(false);
                                setSendOpen(true);
                            }}
                        >
                            <Send className="h-4 w-4 text-blue-600" /> Versenden
                        </button>
                    )}
                    {!isLocked && (
                        <button type="button" className={itemClass} onClick={handleTogglePaid} disabled={isPending}>
                            {isPaid ? <X className="h-4 w-4" /> : <Check className="h-4 w-4 text-green-600" />}
                            {isPaid ? "Als unbezahlt markieren" : "Als bezahlt markieren"}
                        </button>
                    )}
                    {!isLocked && (
                        <button
                            type="button"
                            className={`${itemClass} text-red-600`}
                            onClick={() => {
                                setMenuOpen(false);
                                setCancelOpen(true);
                            }}
                        >
                            <Ban className="h-4 w-4" /> Stornieren
                        </button>
                    )}
                </PopoverContent>
            </Popover>

            {!isCancelledOriginal && (
                <SendInvoiceDialog
                    invoiceId={invoice.id}
                    customerId={invoice.customerId}
                    invoiceNumber={invoice.invoiceNumber || undefined}
                    customerLastName={invoice.lastName}
                    insuranceNumber={invoice.insuranceNumber || undefined}
                    open={sendOpen}
                    onOpenChange={setSendOpen}
                />
            )}
            {!isLocked && (
                <CancelInvoiceDialog
                    id={invoice.id}
                    invoiceNumber={invoice.invoiceNumber}
                    open={cancelOpen}
                    onOpenChange={setCancelOpen}
                />
            )}
        </>
    );
}

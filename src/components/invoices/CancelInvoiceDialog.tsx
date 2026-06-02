"use client";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Ban } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { cancelInvoice } from "@/lib/actions/invoice.actions";

interface CancelInvoiceDialogProps {
    id: number;
    invoiceNumber?: string | null;
    /** Render a labeled button ("Stornieren") instead of the icon-only trigger. */
    withLabel?: boolean;
    /** Controlled open state (e.g. when opened from a dropdown menu). Hides the built-in trigger. */
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function CancelInvoiceDialog({ id, invoiceNumber, withLabel = false, open: controlledOpen, onOpenChange }: CancelInvoiceDialogProps) {
    const isControlled = controlledOpen !== undefined;
    const [internalOpen, setInternalOpen] = useState(false);
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = (value: boolean) => {
        if (isControlled) onOpenChange?.(value);
        else setInternalOpen(value);
    };
    const [isPending, startTransition] = useTransition();

    const handleCancel = () => {
        startTransition(async () => {
            const result = await cancelInvoice(id);
            if (result.success) {
                toast.success(
                    result.stornoInvoiceNumber
                        ? `Stornorechnung ${result.stornoInvoiceNumber} erstellt`
                        : "Rechnung storniert"
                );
            } else {
                toast.error(result.error || "Fehler beim Stornieren");
            }
        });
    };

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <AlertDialogTrigger asChild>
                    {withLabel ? (
                        <Button variant="destructive" size="sm" title="Rechnung stornieren">
                            <Ban className="h-4 w-4 mr-2" /> Stornieren
                        </Button>
                    ) : (
                        <Button variant="destructive" size="icon" title="Rechnung stornieren">
                            <Ban className="h-4 w-4" />
                        </Button>
                    )}
                </AlertDialogTrigger>
            )}
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Rechnung stornieren?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Es wird automatisch eine Stornorechnung mit negativen Beträgen erstellt und die
                        Rechnung {invoiceNumber ? `${invoiceNumber} ` : ""}als storniert markiert.
                        Stornierte Rechnungen können danach nicht mehr bearbeitet oder gelöscht werden.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={handleCancel} className="bg-red-600 hover:bg-red-700" disabled={isPending}>
                        {isPending ? "Storniere..." : "Stornieren"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

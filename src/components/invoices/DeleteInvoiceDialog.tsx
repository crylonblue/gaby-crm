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
import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";
import { deleteInvoice } from "@/lib/actions/invoice.actions";

interface DeleteInvoiceDialogProps {
    id: number;
    invoiceNumber?: string | null;
}

export function DeleteInvoiceDialog({ id, invoiceNumber }: DeleteInvoiceDialogProps) {
    const [isPending, startTransition] = useTransition();

    const handleDelete = () => {
        startTransition(async () => {
            const result = await deleteInvoice(id);
            if (result.success) {
                toast.success("Rechnung gelöscht");
            } else {
                toast.error(result.error || "Fehler beim Löschen");
            }
        });
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Rechnung löschen?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Möchten Sie die Rechnung {invoiceNumber ? `"${invoiceNumber}"` : ""} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700" disabled={isPending}>
                        {isPending ? "Lösche..." : "Löschen"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

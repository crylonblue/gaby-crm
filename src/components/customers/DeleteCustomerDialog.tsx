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
import { deleteCustomer } from "@/lib/actions/customer.actions";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface DeleteCustomerDialogProps {
    customerId: number;
    customerName: string;
    className?: string;
    redirectTo?: string;
}

export function DeleteCustomerDialog({
    customerId,
    customerName,
    className,
    redirectTo,
}: DeleteCustomerDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    function handleDelete() {
        startTransition(async () => {
            try {
                await deleteCustomer(customerId);
                toast.success("Kunde wurde gelöscht");
                setOpen(false);
                if (redirectTo) {
                    router.push(redirectTo);
                }
            } catch (error) {
                toast.error("Fehler beim Löschen");
                console.error(error);
            }
        });
    }

    return (
        <AlertDialog open={open} onOpenChange={setOpen}>
            <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon" className={className}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Sind Sie absolut sicher?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Diese Aktion kann nicht rückgängig gemacht werden. Damit wird der Kunde{" "}
                        <span className="font-semibold text-foreground">{customerName}</span>{" "}
                        unwiderruflich aus der Datenbank gelöscht.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            handleDelete();
                        }}
                        disabled={isPending}
                        className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                    >
                        {isPending ? "Lösche..." : "Ja, löschen"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

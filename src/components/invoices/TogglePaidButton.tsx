"use client";

import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { toggleInvoicePaid } from "@/lib/actions/invoice.actions";
import { useState, useTransition } from "react";
import { toast } from "sonner";

interface TogglePaidButtonProps {
    invoiceId: number;
    paid: boolean;
}

export function TogglePaidButton({ invoiceId, paid }: TogglePaidButtonProps) {
    const [isPending, startTransition] = useTransition();
    const [currentPaid, setCurrentPaid] = useState(paid);

    const handleToggle = () => {
        startTransition(async () => {
            const result = await toggleInvoicePaid(invoiceId);
            if (result.success) {
                setCurrentPaid(result.paid ?? !currentPaid);
                toast.success(result.paid ? "Rechnung als bezahlt markiert" : "Rechnung als unbezahlt markiert");
            } else {
                toast.error(result.error || "Fehler beim Aktualisieren");
            }
        });
    };

    return (
        <Button
            variant={currentPaid ? "outline" : "default"}
            size="icon"
            onClick={handleToggle}
            disabled={isPending}
            className={!currentPaid ? "bg-green-600 hover:bg-green-700 text-white" : ""}
            title={currentPaid ? "Als unbezahlt markieren" : "Als bezahlt markieren"}
        >
            {!currentPaid ? (
                <Check className="h-4 w-4" />
            ) : (
                <X className="h-4 w-4" />
            )}
        </Button>
    );
}


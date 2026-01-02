"use client";

import { useState, useTransition, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sendInvoice } from "@/lib/actions/invoice.actions";
import { getCustomer } from "@/lib/actions/customer.actions";

interface SendInvoiceDialogProps {
    invoiceId: number;
    customerId: number;
}

export function SendInvoiceDialog({ invoiceId, customerId }: SendInvoiceDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [useInsuranceEmail, setUseInsuranceEmail] = useState(true);
    const [customEmail, setCustomEmail] = useState("");
    const [attachAbtretungserklaerung, setAttachAbtretungserklaerung] = useState(false);
    const [insuranceEmail, setInsuranceEmail] = useState("");
    const [hasAbtretungserklaerung, setHasAbtretungserklaerung] = useState(false);
    const [loadingCustomer, setLoadingCustomer] = useState(false);

    useEffect(() => {
        if (open && customerId) {
            setLoadingCustomer(true);
            getCustomer(customerId).then((customer) => {
                if (customer) {
                    setInsuranceEmail(customer.healthInsuranceEmail || "");
                    setCustomEmail(customer.healthInsuranceEmail || "");
                    setHasAbtretungserklaerung(!!customer.abtretungserklaerungUrl);
                }
                setLoadingCustomer(false);
            });
        } else if (!open) {
            // Reset form when dialog closes
            setUseInsuranceEmail(true);
            setCustomEmail("");
            setAttachAbtretungserklaerung(false);
            setInsuranceEmail("");
            setHasAbtretungserklaerung(false);
        }
    }, [open, customerId]);

    const handleUseInsuranceEmailChange = (checked: boolean) => {
        setUseInsuranceEmail(checked);
        if (checked) {
            setCustomEmail(insuranceEmail);
        }
    };

    const handleSubmit = () => {
        const email = useInsuranceEmail ? insuranceEmail : customEmail;
        
        if (!email || email.trim() === "") {
            toast.error("Bitte geben Sie eine E-Mail-Adresse ein");
            return;
        }

        startTransition(async () => {
            const result = await sendInvoice({
                invoiceId,
                email,
                attachAbtretungserklaerung: hasAbtretungserklaerung ? attachAbtretungserklaerung : false,
            });

            if (result.success) {
                toast.success("Rechnung wurde erfolgreich gesendet");
                setOpen(false);
            } else {
                toast.error(result.error || "Fehler beim Senden der Rechnung");
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Rechnung versenden" className="border">
                    <Send className="h-4 w-4 text-blue-600" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rechnung verschicken</DialogTitle>
                    <DialogDescription>
                        Wählen Sie die E-Mail-Adresse und Optionen für den Versand der Rechnung.
                    </DialogDescription>
                </DialogHeader>
                {loadingCustomer ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : (
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>E-Mail-Adresse</Label>
                            <div className="space-y-3">
                                <div className="flex items-center space-x-2">
                                    <Checkbox
                                        id="useInsuranceEmail"
                                        checked={useInsuranceEmail}
                                        onCheckedChange={handleUseInsuranceEmailChange}
                                    />
                                    <Label htmlFor="useInsuranceEmail" className="font-normal cursor-pointer">
                                        Versicherungs-E-Mail verwenden
                                    </Label>
                                </div>
                                <Input
                                    type="email"
                                    placeholder="email@example.com"
                                    value={useInsuranceEmail ? insuranceEmail : customEmail}
                                    onChange={(e) => {
                                        if (!useInsuranceEmail) {
                                            setCustomEmail(e.target.value);
                                        }
                                    }}
                                    disabled={useInsuranceEmail}
                                />
                            </div>
                        </div>

                        {hasAbtretungserklaerung && (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="attachAbtretungserklaerung"
                                    checked={attachAbtretungserklaerung}
                                    onCheckedChange={setAttachAbtretungserklaerung}
                                />
                                <Label htmlFor="attachAbtretungserklaerung" className="font-normal cursor-pointer">
                                    Abtretungserklärung beifügen
                                </Label>
                            </div>
                        )}
                    </div>
                )}
                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
                        Abbrechen
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending || loadingCustomer}>
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Wird gesendet...
                            </>
                        ) : (
                            <>
                                <Send className="mr-2 h-4 w-4" />
                                Senden
                            </>
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


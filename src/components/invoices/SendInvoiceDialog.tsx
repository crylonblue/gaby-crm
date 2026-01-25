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
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { sendInvoice } from "@/lib/actions/invoice.actions";
import { getCustomer } from "@/lib/actions/customer.actions";

interface SendInvoiceDialogProps {
    invoiceId: number;
    customerId: number;
    invoiceNumber?: string;
    customerLastName?: string;
    insuranceNumber?: string;
}

export function SendInvoiceDialog({ invoiceId, customerId, invoiceNumber, customerLastName, insuranceNumber }: SendInvoiceDialogProps) {
    const [open, setOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [useInsuranceEmail, setUseInsuranceEmail] = useState(true);
    const [customEmail, setCustomEmail] = useState("");
    const [attachAbtretungserklaerung, setAttachAbtretungserklaerung] = useState(false);
    const [insuranceEmail, setInsuranceEmail] = useState("");
    const [hasAbtretungserklaerung, setHasAbtretungserklaerung] = useState(false);
    const [loadingCustomer, setLoadingCustomer] = useState(false);
    const [emailSubject, setEmailSubject] = useState("");
    const [emailBody, setEmailBody] = useState("");

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
            // Set default values when opening
            const defaultSubject = insuranceNumber 
                ? `${insuranceNumber}: Rechnung für die Verhinderungspflege` 
                : "Rechnung für die Verhinderungspflege";
            const defaultBody = `Guten Tag,

Bitte überweisen Sie die Rechnung für die Verhinderungspflege von Frau/Herrn ${customerLastName || ""} auf mein Konto. Die Abtretungserklärung liegt bereits vor.
Vielen Dank und mit freundlichen Grüßen,

Gaby Casper

---
Seniorenassistenz
Holmer Weg 14
21244 Buchholz
0171/3850187`;
            setEmailSubject(defaultSubject);
            setEmailBody(defaultBody);
        } else if (!open) {
            // Reset form when dialog closes
            setUseInsuranceEmail(true);
            setCustomEmail("");
            setAttachAbtretungserklaerung(false);
            setInsuranceEmail("");
            setHasAbtretungserklaerung(false);
            setEmailSubject("");
            setEmailBody("");
        }
    }, [open, customerId, customerLastName, insuranceNumber]);

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

        if (!emailSubject.trim()) {
            toast.error("Bitte geben Sie einen Betreff ein");
            return;
        }

        startTransition(async () => {
            const result = await sendInvoice({
                invoiceId,
                email,
                attachAbtretungserklaerung: hasAbtretungserklaerung ? attachAbtretungserklaerung : false,
                emailSubject: emailSubject.trim(),
                emailBody: emailBody.trim(),
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

                        <div className="space-y-2">
                            <Label htmlFor="emailSubject">Betreff</Label>
                            <Input
                                id="emailSubject"
                                placeholder="Betreff der E-Mail"
                                value={emailSubject}
                                onChange={(e) => setEmailSubject(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="emailBody">Nachricht</Label>
                            <Textarea
                                id="emailBody"
                                placeholder="Text der E-Mail"
                                value={emailBody}
                                onChange={(e) => setEmailBody(e.target.value)}
                                rows={12}
                            />
                        </div>

                        {hasAbtretungserklaerung && (
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="attachAbtretungserklaerung"
                                    checked={attachAbtretungserklaerung}
                                    onCheckedChange={(checked) => setAttachAbtretungserklaerung(checked === true)}
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


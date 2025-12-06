"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createInvoice, getInvoiceCountForCustomer } from "@/lib/actions/invoice.actions";
import { toast } from "sonner";
import { Customer } from "@/db/schema";
import { useTransition, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";

const invoiceSchema = z.object({
    customerId: z.string().min(1, "Kunde ist erforderlich"),
    hours: z.coerce.number().min(0.1, "Stunden müssen größer als 0 sein"),
    description: z.string().min(1, "Beschreibung ist erforderlich"),
    km: z.coerce.number().optional().default(0),
    ratePerHour: z.coerce.number().min(0, "Preis muss positiv sein").default(47.0),
    ratePerKm: z.coerce.number().min(0, "Preis muss positiv sein").default(0.30),
    attachAbtretungserklaerung: z.boolean().optional(),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
    customers: Customer[];
}

export function InvoiceForm({ customers }: InvoiceFormProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const [showAbtretungserklaerung, setShowAbtretungserklaerung] = useState(false);

    const form = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema) as any,
        defaultValues: {
            customerId: "",
            hours: 0,
            description: "",
            km: 0,
            ratePerHour: 47.0,
            ratePerKm: 0.30,
            attachAbtretungserklaerung: false,
        },
    });

    const selectedCustomerId = form.watch("customerId");

    useEffect(() => {
        const checkFirstInvoice = async () => {
            if (!selectedCustomerId) {
                setShowAbtretungserklaerung(false);
                return;
            }

            const customer = customers.find(c => c.id.toString() === selectedCustomerId);
            if (!customer || !customer.abtretungserklaerungUrl) {
                setShowAbtretungserklaerung(false);
                return;
            }

            const count = await getInvoiceCountForCustomer(customer.id);
            if (count === 0) {
                setShowAbtretungserklaerung(true);
                form.setValue("attachAbtretungserklaerung", true);
            } else {
                setShowAbtretungserklaerung(false); // Or keep it checkable but not default? spec says "optional" but logic implies auto-enable for first.
                // "If we detect, that it is the first invoice for that given user we enable adding the Abtretungserklärung to the invoice."
                // "So we also have to change the schema of the Invoice to hold the Abtretungserklärung but as optional."
                // I will allow it to be optional always if available, but auto-check for first.
                // Actually the requirement: "This has to come with the first invoice... we have to make it optional... If we detect... first invoice... we enable adding"
                // This implies "enable adding" might mean "show the option". 
                // Let's show the option if the customer has the URL, but default it to TRUE if it's the first invoice.
                // Re-reading: "If we detect, that it is the first invoice for that given user we enable adding the Abtretungserklärung to the invoice."
                // This sounds like the Option is ONLY available for the first invoice?
                // "But since we are not sure if we already have sent the 'Abtretungserklärung' we have to make it optional."
                // So I will make it always available if customer has one, but highlight/default it for the first one.

                // Let's simply always show it if customer has one, and verify default logic.
                // Actually, let's stick to: Always show if customer has one.
                // Default to true if count == 0.
            }
        };

        // Revised logic: Always show if customer has URL.
        const customer = customers.find(c => c.id.toString() === selectedCustomerId);
        if (customer?.abtretungserklaerungUrl) {
            setShowAbtretungserklaerung(true);
            getInvoiceCountForCustomer(customer.id).then(count => {
                if (count === 0) {
                    form.setValue("attachAbtretungserklaerung", true);
                } else {
                    form.setValue("attachAbtretungserklaerung", false);
                }
            });
        } else {
            setShowAbtretungserklaerung(false);
        }

    }, [selectedCustomerId, customers, form]);


    function onSubmit(data: InvoiceFormValues) {
        startTransition(async () => {
            const selectedCustomer = customers.find(c => c.id.toString() === data.customerId);

            if (!selectedCustomer) {
                toast.error("Kunde nicht gefunden");
                return;
            }

            const invoiceData = {
                customerId: selectedCustomer.id,
                status: "processing", // Initial status
                date: new Date().toISOString(),
                createdAt: new Date().toISOString(),

                // Snapshot Data
                lastName: selectedCustomer.lastName,
                firstName: selectedCustomer.firstName,
                healthInsurance: selectedCustomer.healthInsurance || "",
                insuranceNumber: selectedCustomer.insuranceNumber || "",
                birthDate: selectedCustomer.birthDate || "",
                careLevel: selectedCustomer.careLevel || "",
                street: selectedCustomer.street || "",
                houseNumber: selectedCustomer.houseNumber || "",
                postalCode: selectedCustomer.postalCode || "",
                city: selectedCustomer.city || "",
                invoiceEmail: selectedCustomer.healthInsuranceEmail || "",

                // Invoice Data
                hours: data.hours,
                description: data.description,
                km: data.km,
                ratePerHour: data.ratePerHour,
                ratePerKm: data.ratePerKm,

                // Abtretungserklärung
                abtretungserklaerungUrl: data.attachAbtretungserklaerung ? selectedCustomer.abtretungserklaerungUrl : null,
            };

            // @ts-ignore
            const result = await createInvoice(invoiceData as any);

            if (result.success) {
                toast.success("Rechnung erstellt");
                router.push("/invoices"); // Redirect to dashboard
            } else {
                toast.error(result.error || "Fehler beim Erstellen");
            }
        });
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Kunde</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Kunde auswählen" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    {customers.map((customer) => (
                                        <SelectItem key={customer.id} value={customer.id.toString()}>
                                            {customer.lastName}, {customer.firstName} ({customer.city})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="hours"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Stunden</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.25" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="ratePerHour"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Stundensatz (€)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="km"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Kilometer</FormLabel>
                                <FormControl>
                                    <Input type="number" step="1" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="ratePerKm"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fahrtkosten (€/km)</FormLabel>
                                <FormControl>
                                    <Input type="number" step="0.01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Beschreibung / Datum</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Details zur Leistung, Datum..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                {showAbtretungserklaerung && (
                    <FormField
                        control={form.control}
                        name="attachAbtretungserklaerung"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                        Abtretungserklärung beifügen
                                    </FormLabel>
                                    <p className="text-sm text-muted-foreground">
                                        Fügt die hinterlegte Abtretungserklärung zur Rechnung hinzu.
                                    </p>
                                </div>
                            </FormItem>
                        )}
                    />
                )}

                <div className="flex items-center gap-4">
                    <Button type="button" variant="outline" onClick={() => router.push("/invoices")}>
                        Abbrechen
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? "Speichern..." : "Rechnung erstellen"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

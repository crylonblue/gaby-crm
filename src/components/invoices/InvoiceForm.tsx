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
import { createInvoice } from "@/lib/actions/invoice.actions";
import { toast } from "sonner";
import { Customer } from "@/db/schema";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

const invoiceSchema = z.object({
    customerId: z.string().min(1, "Kunde ist erforderlich"),
    hours: z.coerce.number().min(0.1, "Stunden müssen größer als 0 sein"),
    description: z.string().min(1, "Beschreibung ist erforderlich"),
    km: z.coerce.number().optional().default(0),
    ratePerHour: z.coerce.number().min(0, "Preis muss positiv sein").default(47.0),
    ratePerKm: z.coerce.number().min(0, "Preis muss positiv sein").default(0.30),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
    customers: Customer[];
}

export function InvoiceForm({ customers }: InvoiceFormProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();

    const form = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema) as any,
        defaultValues: {
            customerId: "",
            hours: 0,
            description: "",
            km: 0,
            ratePerHour: 47.0,
            ratePerKm: 0.30,
        },
    });

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
            };

            // @ts-ignore - DB insert type might be strict about optional fields, but we provide all required ones.
            // Using ignore to avoid strict type warring on some optional fields mismatches if any.
            // Actually, let's try strict first.

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

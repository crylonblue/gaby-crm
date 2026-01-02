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
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createInvoice } from "@/lib/actions/invoice.actions";
import { toast } from "sonner";
import { Customer } from "@/db/schema";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

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
    customers: (Customer & { yearlyBudget?: number })[];
}

export function InvoiceForm({ customers }: InvoiceFormProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const [open, setOpen] = useState(false);

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

    const selectedCustomerId = form.watch("customerId");
    const hours = form.watch("hours");
    const km = form.watch("km");
    const ratePerHour = form.watch("ratePerHour");
    const ratePerKm = form.watch("ratePerKm");

    // Get selected customer and their yearly budget
    const selectedCustomer = customers.find(c => c.id.toString() === selectedCustomerId);
    const yearlyBudget = selectedCustomer?.yearlyBudget || 0;

    // Calculate invoice amount in real-time
    const invoiceAmount = ((hours || 0) * (ratePerHour || 0) + (km || 0) * (ratePerKm || 0)) * 1.19;


    function onSubmit(data: InvoiceFormValues) {
        startTransition(async () => {
            const selectedCustomer = customers.find(c => c.id.toString() === data.customerId);

            if (!selectedCustomer) {
                toast.error("Kunde nicht gefunden");
                return;
            }

            const invoiceData = {
                customerId: selectedCustomer.id,
                status: "offen",
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
                invoiceEmail: "",

                // Invoice Data
                hours: data.hours,
                description: data.description,
                km: data.km,
                ratePerHour: data.ratePerHour,
                ratePerKm: data.ratePerKm,

                // Abtretungserklärung
                abtretungserklaerungUrl: null,
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
                        <FormItem className="flex flex-col">
                            <FormLabel>Kunde</FormLabel>
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={open}
                                            className={cn(
                                                "w-full justify-between",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value
                                                ? customers.find(
                                                    (customer) => customer.id.toString() === field.value
                                                )?.lastName + ", " + customers.find(
                                                    (customer) => customer.id.toString() === field.value
                                                )?.firstName
                                                : "Kunde auswählen..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="p-0"
                                    style={{ width: "var(--radix-popover-trigger-width)" }}
                                    align="start"
                                >
                                    <Command>
                                        <CommandInput placeholder="Kunde suchen..." className="h-9" />
                                        <CommandList>
                                            <CommandEmpty>Kein Kunde gefunden.</CommandEmpty>
                                            <CommandGroup>
                                                {customers.map((customer) => (
                                                    <CommandItem
                                                        value={`${customer.lastName}, ${customer.firstName}`}
                                                        key={customer.id}
                                                        onSelect={() => {
                                                            form.setValue("customerId", customer.id.toString());
                                                            setOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                customer.id.toString() === field.value
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        {customer.lastName}, {customer.firstName} ({customer.city})
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
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

                {/* Invoice Amount Calculation */}
                <div className="rounded-md border p-4 bg-primary/5 border-primary/20">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-sm font-medium text-muted-foreground mb-1">
                                Rechnungsbetrag (inkl. MwSt.)
                            </div>
                            <div className="text-2xl font-bold text-primary">
                                {invoiceAmount.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                            </div>
                        </div>
                    </div>
                    <div className="mt-2 space-y-1">
                        <div className="text-xs text-muted-foreground">
                            Netto: {((hours || 0) * (ratePerHour || 0) + (km || 0) * (ratePerKm || 0)).toLocaleString("de-DE", { style: "currency", currency: "EUR" })} + 19% MwSt.
                        </div>
                        {selectedCustomer && (
                            <div className="text-xs text-muted-foreground">
                                Abgerechnet dieses Jahr: {yearlyBudget.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button type="button" variant="outline" onClick={() => router.push("/invoices")}>
                        Abbrechen
                    </Button>
                    <Button type="submit" disabled={isPending}>
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Speichern...
                            </>
                        ) : (
                            "Rechnung erstellen"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

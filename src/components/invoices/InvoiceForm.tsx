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
import { createInvoice, updateInvoice } from "@/lib/actions/invoice.actions";
import { toast } from "sonner";
import { Customer, Invoice, NewInvoice } from "@/db/schema";
import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Check, ChevronsUpDown, Loader2, AlertTriangle, ExternalLink } from "lucide-react";
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
import { LineItemsEditor, LineItem } from "./LineItemsEditor";

/** Required customer fields for XRechnung invoice creation */
const INVOICE_REQUIRED_FIELDS = [
    { key: "healthInsurance", label: "Name der Krankenkasse" },
    { key: "healthInsuranceStreet", label: "Straße der Krankenkasse" },
    { key: "healthInsurancePostalCode", label: "PLZ der Krankenkasse" },
    { key: "healthInsuranceCity", label: "Ort der Krankenkasse" },
] as const;

function getCustomerInvoiceCompleteness(customer: Customer | undefined): { complete: boolean; missingFields: string[] } {
    if (!customer) return { complete: false, missingFields: [] };

    const missingFields: string[] = [];
    for (const { key, label } of INVOICE_REQUIRED_FIELDS) {
        const value = customer[key as keyof Customer];
        if (!value || (typeof value === "string" && !value.trim())) {
            missingFields.push(label);
        }
    }
    return {
        complete: missingFields.length === 0,
        missingFields,
    };
}

const invoiceSchema = z.object({
    customerId: z.string().min(1, "Kunde ist erforderlich"),
    lineItems: z.array(z.object({
        id: z.string(),
        description: z.string().min(1, "Beschreibung ist erforderlich"),
        quantity: z.number().min(0.01, "Menge muss größer als 0 sein"),
        unit: z.string().min(1, "Einheit ist erforderlich"),
        unitPrice: z.number().min(0, "Preis muss positiv sein"),
        vatRate: z.number().min(0).max(100),
        total: z.number(),
    })).min(1, "Mindestens eine Position ist erforderlich"),
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
    customers: (Customer & { yearlyBudget?: number })[];
    invoice?: Invoice | null;
}

function safeParseLineItemsJson(lineItemsJson: string | null): LineItem[] {
    if (!lineItemsJson) return [];
    try {
        const parsed = JSON.parse(lineItemsJson);
        if (!Array.isArray(parsed)) return [];
        return parsed as LineItem[];
    } catch {
        return [];
    }
}

export function InvoiceForm({ customers, invoice }: InvoiceFormProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const form = useForm<InvoiceFormValues>({
        resolver: zodResolver(invoiceSchema),
        defaultValues: {
            customerId: invoice ? invoice.customerId.toString() : "",
            lineItems: invoice ? safeParseLineItemsJson(invoice.lineItemsJson) : [],
        },
    });

    const selectedCustomerId = form.watch("customerId");
    const lineItems = form.watch("lineItems");

    // Get selected customer and their yearly budget
    const selectedCustomer = customers.find(c => c.id.toString() === selectedCustomerId);
    const yearlyBudget = selectedCustomer?.yearlyBudget || 0;
    const { complete: customerComplete, missingFields } = getCustomerInvoiceCompleteness(selectedCustomer);

    // Calculate invoice totals
    const netTotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const vatTotal = lineItems.reduce((sum, item) => sum + (item.total * (item.vatRate / 100)), 0);
    const grossTotal = netTotal + vatTotal;

    function onSubmit(data: InvoiceFormValues) {
        startTransition(async () => {
            const selectedCustomer = customers.find(c => c.id.toString() === data.customerId);

            if (!selectedCustomer) {
                toast.error("Kunde nicht gefunden");
                return;
            }

            // Insurance is required as invoice recipient for XRechnung
            const hasInsurance = selectedCustomer.healthInsurance &&
                selectedCustomer.healthInsuranceStreet &&
                selectedCustomer.healthInsurancePostalCode &&
                selectedCustomer.healthInsuranceCity;
            if (!hasInsurance) {
                toast.error("Bitte erfassen Sie zuerst die vollständigen Krankenkassendaten (Name, Straße, PLZ, Ort) beim Kunden.");
                return;
            }

            // Convert line items to the format expected by the database
            // For backward compatibility, we'll use the first item for hours/km if applicable
            const firstItem = data.lineItems[0];
            const hoursItem = data.lineItems.find(item => item.unit === "hour");
            const kmItem = data.lineItems.find(item => item.unit === "km");

            const invoiceData: NewInvoice = {
                customerId: selectedCustomer.id,
                status: "offen",
                date: invoice?.date ?? new Date().toISOString(),
                createdAt: invoice?.createdAt ?? new Date().toISOString(),

                // Snapshot Data
                lastName: selectedCustomer.lastName,
                firstName: selectedCustomer.firstName,
                healthInsurance: selectedCustomer.healthInsurance || "",
                healthInsuranceStreet: selectedCustomer.healthInsuranceStreet || "",
                healthInsuranceHouseNumber: selectedCustomer.healthInsuranceHouseNumber || "",
                healthInsurancePostalCode: selectedCustomer.healthInsurancePostalCode || "",
                healthInsuranceCity: selectedCustomer.healthInsuranceCity || "",
                healthInsuranceCountry: selectedCustomer.healthInsuranceCountry || "DE",
                healthInsuranceEmail: selectedCustomer.healthInsuranceEmail || "",
                insuranceNumber: selectedCustomer.insuranceNumber || "",
                birthDate: selectedCustomer.birthDate || "",
                careLevel: selectedCustomer.careLevel || "",
                street: selectedCustomer.street || "",
                houseNumber: selectedCustomer.houseNumber || "",
                postalCode: selectedCustomer.postalCode || "",
                city: selectedCustomer.city || "",
                invoiceEmail: "",

                // Invoice Data - use first item or hours/km items
                hours: hoursItem?.quantity || firstItem?.quantity || 0,
                description: firstItem?.description || "",
                km: kmItem?.quantity || 0,
                ratePerHour: hoursItem?.unitPrice || firstItem?.unitPrice || 47.0,
                ratePerKm: kmItem?.unitPrice || 0.30,
                
                // Store line items as JSON for future use
                lineItemsJson: JSON.stringify(data.lineItems),
            };

            if (invoice) {
                const result = await updateInvoice(invoice.id, invoiceData);
                if (result.success) {
                    toast.success("Rechnung aktualisiert");
                    router.push("/invoices");
                } else {
                    toast.error(result.error || "Fehler beim Aktualisieren");
                }
                return;
            }

            const result = await createInvoice(invoiceData);
            if (result.success) {
                toast.success("Rechnung erstellt");
                router.push("/invoices");
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
                                            disabled={!!invoice}
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

                {selectedCustomer && !customerComplete && (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-4">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-500 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                                    Kundendaten unvollständig für Rechnungserstellung
                                </p>
                                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                                    Folgende Angaben fehlen: {missingFields.join(", ")}
                                </p>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="mt-3 border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/50"
                                    asChild
                                >
                                    <Link href={`/customers/${selectedCustomer.id}`}>
                                        <ExternalLink className="mr-2 h-4 w-4" />
                                        Kundendaten vervollständigen
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <FormField
                    control={form.control}
                    name="lineItems"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Positionen</FormLabel>
                            <FormControl>
                                <LineItemsEditor
                                    lineItems={field.value}
                                    onChange={field.onChange}
                                    disabled={!customerComplete}
                                    disabledMessage={!selectedCustomer
                                        ? "Bitte wählen Sie zuerst einen Kunden aus."
                                        : "Bitte vervollständigen Sie zuerst die Kundendaten (Krankenkasse), um Positionen hinzuzufügen."
                                    }
                                />
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
                                {grossTotal.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
                            </div>
                        </div>
                    </div>
                    <div className="mt-2 space-y-1">
                        <div className="text-xs text-muted-foreground">
                            Netto: {netTotal.toLocaleString("de-DE", { style: "currency", currency: "EUR" })} + MwSt.: {vatTotal.toLocaleString("de-DE", { style: "currency", currency: "EUR" })}
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
                    <Button type="submit" disabled={isPending || !customerComplete}>
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Speichern...
                            </>
                        ) : (
                            invoice ? "Rechnung aktualisieren" : "Rechnung erstellen"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

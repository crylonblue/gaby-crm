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
import { createInvoice, getInvoiceCountForCustomer } from "@/lib/actions/invoice.actions";
import { toast } from "sonner";
import { Customer } from "@/db/schema";
import { useTransition, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Checkbox } from "@/components/ui/checkbox";
import { Check, ChevronsUpDown } from "lucide-react";
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
    attachAbtretungserklaerung: z.boolean().optional(),
    sendEmailAutomatically: z.boolean().default(true),
    useInsuranceEmail: z.boolean().default(true),
    customEmail: z.string().email("Ungültige E-Mail").optional().or(z.literal("")),
}).refine((data) => {
    // If sendEmailAutomatically is true and useInsuranceEmail is false, customEmail is required
    if (data.sendEmailAutomatically && !data.useInsuranceEmail) {
        return data.customEmail && data.customEmail.length > 0;
    }
    return true;
}, {
    message: "Bitte geben Sie eine E-Mail-Adresse ein",
    path: ["customEmail"],
});

type InvoiceFormValues = z.infer<typeof invoiceSchema>;

interface InvoiceFormProps {
    customers: Customer[];
}

export function InvoiceForm({ customers }: InvoiceFormProps) {
    const [isPending, startTransition] = useTransition();
    const router = useRouter();
    const [showAbtretungserklaerung, setShowAbtretungserklaerung] = useState(false);

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
            attachAbtretungserklaerung: false,
            sendEmailAutomatically: true,
            useInsuranceEmail: true,
            customEmail: "",
        },
    });

    const selectedCustomerId = form.watch("customerId");
    const sendEmailAutomatically = form.watch("sendEmailAutomatically");
    const useInsuranceEmail = form.watch("useInsuranceEmail");

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
                // Only set to true if sendEmailAutomatically is enabled
                if (sendEmailAutomatically) {
                    form.setValue("attachAbtretungserklaerung", true);
                }
            } else {
                setShowAbtretungserklaerung(true);
                form.setValue("attachAbtretungserklaerung", false);
            }
        };

        const customer = customers.find(c => c.id.toString() === selectedCustomerId);
        if (customer?.abtretungserklaerungUrl) {
            setShowAbtretungserklaerung(true);
            getInvoiceCountForCustomer(customer.id).then(count => {
                if (count === 0 && sendEmailAutomatically) {
                    form.setValue("attachAbtretungserklaerung", true);
                } else {
                    form.setValue("attachAbtretungserklaerung", false);
                }
            });
        } else {
            setShowAbtretungserklaerung(false);
        }

    }, [selectedCustomerId, customers, form, sendEmailAutomatically]);

    // Reset attachAbtretungserklaerung when sendEmailAutomatically is disabled
    useEffect(() => {
        if (!sendEmailAutomatically) {
            form.setValue("attachAbtretungserklaerung", false);
        }
    }, [sendEmailAutomatically, form]);


    function onSubmit(data: InvoiceFormValues) {
        startTransition(async () => {
            const selectedCustomer = customers.find(c => c.id.toString() === data.customerId);

            if (!selectedCustomer) {
                toast.error("Kunde nicht gefunden");
                return;
            }

            // Determine the email to use
            let invoiceEmail = "";
            if (data.sendEmailAutomatically) {
                if (data.useInsuranceEmail) {
                    invoiceEmail = selectedCustomer.healthInsuranceEmail || "";
                } else {
                    invoiceEmail = data.customEmail || "";
                }
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
                invoiceEmail: invoiceEmail,

                // Invoice Data
                hours: data.hours,
                description: data.description,
                km: data.km,
                ratePerHour: data.ratePerHour,
                ratePerKm: data.ratePerKm,

                // Abtretungserklärung
                abtretungserklaerungUrl: data.attachAbtretungserklaerung ? selectedCustomer.abtretungserklaerungUrl : null,

                // Email sending options
                sendEmailAutomatically: data.sendEmailAutomatically,
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

                {/* Email sending options */}
                <div className="space-y-4 rounded-md border p-4">
                    <FormField
                        control={form.control}
                        name="sendEmailAutomatically"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel>
                                        E-Mail automatisch versenden
                                    </FormLabel>
                                    <p className="text-sm text-muted-foreground">
                                        Rechnung wird automatisch per E-Mail an die Versicherung gesendet.
                                    </p>
                                </div>
                            </FormItem>
                        )}
                    />

                    {sendEmailAutomatically && (
                        <>
                            {showAbtretungserklaerung && (
                                <FormField
                                    control={form.control}
                                    name="attachAbtretungserklaerung"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 ml-7">
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

                            <FormField
                                control={form.control}
                                name="useInsuranceEmail"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 ml-7">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                            />
                                        </FormControl>
                                        <div className="space-y-1 leading-none">
                                            <FormLabel>
                                                Versicherungs-E-Mail verwenden
                                            </FormLabel>
                                            <p className="text-sm text-muted-foreground">
                                                Verwendet die hinterlegte E-Mail-Adresse der Versicherung.
                                            </p>
                                        </div>
                                    </FormItem>
                                )}
                            />

                            {!useInsuranceEmail && (
                                <FormField
                                    control={form.control}
                                    name="customEmail"
                                    render={({ field }) => (
                                        <FormItem className="ml-7">
                                            <FormLabel>E-Mail-Adresse</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="email"
                                                    placeholder="email@example.com"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}
                        </>
                    )}
                </div>

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

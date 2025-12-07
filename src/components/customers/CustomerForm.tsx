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
import { createCustomer, updateCustomer } from "@/lib/actions/customer.actions";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Customer } from "@/db/schema";
import { useTransition } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { uploadFile } from "@/lib/actions/upload.actions";
import { useState } from "react";

const customerSchema = z.object({
    lastName: z.string().min(1, "Nachname ist erforderlich"),
    firstName: z.string().min(1, "Vorname ist erforderlich"),
    email: z.string().email("Ungültige E-Mail").optional().or(z.literal("")),
    birthDate: z.string().optional(),
    mobilePhone: z.string().optional(),
    landlinePhone: z.string().optional(),
    street: z.string().optional(),
    houseNumber: z.string().optional(),
    postalCode: z.string().optional(),
    city: z.string().optional(),
    careLevel: z.string().optional(),
    healthInsurance: z.string().optional(),
    healthInsuranceEmail: z.string().email("Ungültige E-Mail").optional().or(z.literal("")),
    insuranceNumber: z.string().optional(),
    notes: z.string().optional(),
    abtretungserklaerungUrl: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

interface CustomerFormProps {
    customer?: Customer;
}

export function CustomerForm({ customer }: CustomerFormProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isUploading, setIsUploading] = useState(false);

    const form = useForm<CustomerFormValues>({
        resolver: zodResolver(customerSchema),
        defaultValues: {
            lastName: customer?.lastName || "",
            firstName: customer?.firstName || "",
            email: customer?.email || "",
            birthDate: customer?.birthDate || "",
            mobilePhone: customer?.mobilePhone || "",
            landlinePhone: customer?.landlinePhone || "",
            street: customer?.street || "",
            houseNumber: customer?.houseNumber || "",
            postalCode: customer?.postalCode || "",
            city: customer?.city || "",
            careLevel: customer?.careLevel || "",
            healthInsurance: customer?.healthInsurance || "",
            healthInsuranceEmail: customer?.healthInsuranceEmail || "",
            insuranceNumber: customer?.insuranceNumber || "",
            notes: customer?.notes || "",
            abtretungserklaerungUrl: customer?.abtretungserklaerungUrl || "",
        },
    });

    function onSubmit(data: CustomerFormValues) {
        startTransition(async () => {
            try {
                if (customer) {
                    await updateCustomer(customer.id, data);
                    toast.success("Kunde aktualisiert");
                } else {
                    await createCustomer(data);
                    toast.success("Kunde erstellt");
                }
                router.push("/customers");
            } catch (error) {
                toast.error("Ein Fehler ist aufgetreten");
                console.error(error);
            }
        });
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append("file", file);

        try {
            const result = await uploadFile(formData);
            if (result.success && result.url) {
                form.setValue("abtretungserklaerungUrl", result.url);
                toast.success("Datei erfolgreich hochgeladen");
            } else {
                toast.error("Fehler beim Hochladen: " + result.error);
            }
        } catch (error) {
            console.error(error);
            toast.error("Upload fehlgeschlagen");
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Vorname</FormLabel>
                                <FormControl>
                                    <Input placeholder="Max" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="lastName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nachname</FormLabel>
                                <FormControl>
                                    <Input placeholder="Mustermann" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>E-Mail</FormLabel>
                            <FormControl>
                                <Input type="email" placeholder="max@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Geburtsdatum</FormLabel>
                            <FormControl>
                                <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                        control={form.control}
                        name="mobilePhone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Handynummer</FormLabel>
                                <FormControl>
                                    <Input placeholder="+49..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="landlinePhone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Festnetz</FormLabel>
                                <FormControl>
                                    <Input placeholder="030..." {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FormField
                        control={form.control}
                        name="street"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>Straße</FormLabel>
                                <FormControl>
                                    <Input placeholder="Hauptstraße" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="houseNumber"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nr.</FormLabel>
                                <FormControl>
                                    <Input placeholder="1A" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <FormField
                        control={form.control}
                        name="postalCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>PLZ</FormLabel>
                                <FormControl>
                                    <Input placeholder="12345" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>Stadt</FormLabel>
                                <FormControl>
                                    <Input placeholder="Berlin" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="border-t pt-4">
                    <h3 className="mb-4 text-lg font-medium">Pflegeversicherung</h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="healthInsurance"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Krankenkasse</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="healthInsuranceEmail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>E-Mail (Kasse)</FormLabel>
                                    <FormControl>
                                        <Input type="email" placeholder="kasse@example.com" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="insuranceNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Versicherungsnummer</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="careLevel"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Pflegegrad</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Bitte wählen" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="1">Grad 1</SelectItem>
                                            <SelectItem value="2">Grad 2</SelectItem>
                                            <SelectItem value="3">Grad 3</SelectItem>
                                            <SelectItem value="4">Grad 4</SelectItem>
                                            <SelectItem value="5">Grad 5</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                <div className="border-t pt-4">
                    <h3 className="mb-4 text-lg font-medium">Dokumente</h3>
                    <FormField
                        control={form.control}
                        name="abtretungserklaerungUrl"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Abtretungserklärung</FormLabel>
                                <div className="space-y-2">
                                    <FormControl>
                                        <Input
                                            type="file"
                                            accept=".pdf,.png,.jpg,.jpeg"
                                            onChange={handleFileUpload}
                                            disabled={isUploading}
                                        />
                                    </FormControl>
                                    {isUploading && <p className="text-sm text-muted-foreground">Wird hochgeladen...</p>}
                                    {field.value && (
                                        <div className="text-sm">
                                            Aktuelle Datei: <a href={field.value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Ansehen</a>
                                            <input type="hidden" {...field} />
                                        </div>
                                    )}
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Notizen</FormLabel>
                            <FormControl>
                                <Textarea className="min-h-[100px]" placeholder="Wichtige Hinweise..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="flex items-center gap-4">
                    <Button type="button" variant="outline" onClick={() => router.push("/customers")}>
                        Abbrechen
                    </Button>
                    <Button type="submit" disabled={isPending || isUploading}>
                        {isPending ? "Speichern..." : customer ? "Aktualisieren" : "Erstellen"}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

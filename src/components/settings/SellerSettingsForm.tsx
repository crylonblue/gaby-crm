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
    FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { updateSellerSettings, uploadLogo, deleteLogo } from "@/lib/actions/seller.actions";
import { toast } from "sonner";
import { SellerSettings } from "@/db/schema";
import { useTransition, useState } from "react";
import { Loader2, Upload, X } from "lucide-react";

const sellerSettingsSchema = z.object({
    name: z.string().min(1, "Firmenname ist erforderlich"),
    subHeadline: z.string().optional(),
    street: z.string().min(1, "Straße ist erforderlich"),
    streetNumber: z.string().min(1, "Hausnummer ist erforderlich"),
    postalCode: z.string().min(1, "Postleitzahl ist erforderlich"),
    city: z.string().min(1, "Stadt ist erforderlich"),
    country: z.string().min(2).max(2),
    phoneNumber: z.string().optional(),
    email: z.string().email("Ungültige E-Mail").optional().or(z.literal("")),
    contactName: z.string().optional(),
    contactPhone: z.string().optional(),
    contactEmail: z.string().email("Ungültige E-Mail").optional().or(z.literal("")),
    taxNumber: z.string().optional(),
    vatId: z.string().optional(),
    court: z.string().optional(),
    registerNumber: z.string().optional(),
    managingDirector: z.string().optional(),
    bankName: z.string().optional(),
    iban: z.string().optional(),
    bic: z.string().optional(),
    invoiceGreeting: z.string().optional(),
});

type SellerSettingsFormValues = z.infer<typeof sellerSettingsSchema>;

interface SellerSettingsFormProps {
    settings: SellerSettings | null;
}

export function SellerSettingsForm({ settings }: SellerSettingsFormProps) {
    const [isPending, startTransition] = useTransition();
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);
    const [logoPreview, setLogoPreview] = useState<string | null>(settings?.logoUrl || null);

    const form = useForm<SellerSettingsFormValues>({
        resolver: zodResolver(sellerSettingsSchema),
        defaultValues: {
            name: settings?.name || "",
            subHeadline: settings?.subHeadline || "",
            street: settings?.street || "",
            streetNumber: settings?.streetNumber || "",
            postalCode: settings?.postalCode || "",
            city: settings?.city || "",
            country: settings?.country || "DE",
            phoneNumber: settings?.phoneNumber || "",
            email: settings?.email || "",
            contactName: settings?.contactName || "",
            contactPhone: settings?.contactPhone || "",
            contactEmail: settings?.contactEmail || "",
            taxNumber: settings?.taxNumber || "",
            vatId: settings?.vatId || "",
            court: settings?.court || "",
            registerNumber: settings?.registerNumber || "",
            managingDirector: settings?.managingDirector || "",
            bankName: settings?.bankName || "",
            iban: settings?.iban || "",
            bic: settings?.bic || "",
            invoiceGreeting: settings?.invoiceGreeting || "",
        },
    });

    function onSubmit(data: SellerSettingsFormValues) {
        startTransition(async () => {
            const result = await updateSellerSettings(data);
            if (result.success) {
                toast.success("Einstellungen gespeichert");
            } else {
                toast.error(result.error || "Fehler beim Speichern");
            }
        });
    }

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Nur Bilddateien sind erlaubt");
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Datei ist zu groß (max. 5MB)");
            return;
        }

        setIsUploadingLogo(true);
        try {
            const formData = new FormData();
            formData.append("file", file);

            const result = await uploadLogo(formData);
            if (result.success && result.logoUrl) {
                toast.success("Logo hochgeladen");
                setLogoPreview(result.logoUrl);
            } else {
                toast.error(result.error || "Fehler beim Hochladen");
            }
        } catch (error) {
            toast.error("Fehler beim Hochladen des Logos");
            console.error(error);
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const handleDeleteLogo = async () => {
        startTransition(async () => {
            const result = await deleteLogo();
            if (result.success) {
                toast.success("Logo gelöscht");
                setLogoPreview(null);
            } else {
                toast.error(result.error || "Fehler beim Löschen");
            }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                {/* Company Information */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Firmeninformationen</h2>
                    
                    <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Firmenname *</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="subHeadline"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Untertitel</FormLabel>
                                <FormControl>
                                    <Input {...field} placeholder="z.B. Steuerberatung" />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Address */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Adresse</h2>
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <FormField
                            control={form.control}
                            name="street"
                            render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                    <FormLabel>Straße *</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="streetNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Hausnummer *</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
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
                                    <FormLabel>Postleitzahl *</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
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
                                    <FormLabel>Stadt *</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>

                    <FormField
                        control={form.control}
                        name="country"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Land</FormLabel>
                                <FormControl>
                                    <Input {...field} maxLength={2} placeholder="DE" />
                                </FormControl>
                                <FormDescription>ISO 3166-1 alpha-2 Code (z.B. DE, AT, CH)</FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Kontaktinformationen</h2>
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="phoneNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Telefonnummer</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="tel" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>E-Mail</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="email" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Contact Person (for XRechnung) */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Ansprechpartner (für XRechnung)</h2>
                    <FormDescription>Mindestens ein Feld sollte ausgefüllt sein für XRechnung-Konformität</FormDescription>
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <FormField
                            control={form.control}
                            name="contactName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="contactPhone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Telefon</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="tel" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="contactEmail"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>E-Mail</FormLabel>
                                    <FormControl>
                                        <Input {...field} type="email" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Tax Information */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Steuerinformationen</h2>
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="taxNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Steuernummer</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="vatId"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>USt-IdNr.</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="DE123456789" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Legal Information */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Rechtliche Informationen</h2>
                    
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                        <FormField
                            control={form.control}
                            name="court"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Amtsgericht</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="z.B. Amtsgericht München" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="registerNumber"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Handelsregisternummer</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="z.B. HRB 123456" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="managingDirector"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Geschäftsführer</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Bank Details */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Bankverbindung</h2>
                    
                    <FormField
                        control={form.control}
                        name="bankName"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Bankname</FormLabel>
                                <FormControl>
                                    <Input {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <FormField
                            control={form.control}
                            name="iban"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>IBAN</FormLabel>
                                    <FormControl>
                                        <Input {...field} placeholder="DE89370400440532013000" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="bic"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>BIC</FormLabel>
                                    <FormControl>
                                        <Input {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </div>
                </div>

                {/* Invoice Text */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Rechnungstext</h2>
                    
                    <FormField
                        control={form.control}
                        name="invoiceGreeting"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Anrede-Text</FormLabel>
                                <FormDescription>
                                    Der Text, der auf Rechnungen nach der Anrede erscheint (z.B. "Sehr geehrte Damen und Herren,")
                                </FormDescription>
                                <FormControl>
                                    <Textarea 
                                        {...field} 
                                        placeholder="Sehr geehrte Damen und Herren,"
                                        rows={2}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                {/* Logo Upload */}
                <div className="space-y-4">
                    <h2 className="text-xl font-semibold">Logo</h2>
                    
                    {logoPreview && (
                        <div className="relative inline-block">
                            <img
                                src={logoPreview}
                                alt="Logo"
                                className="h-32 w-auto object-contain border rounded p-2"
                            />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                onClick={handleDeleteLogo}
                                disabled={isPending}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                className="hidden"
                                disabled={isUploadingLogo}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                disabled={isUploadingLogo}
                                className="gap-2"
                            >
                                {isUploadingLogo ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Hochladen...
                                    </>
                                ) : (
                                    <>
                                        <Upload className="h-4 w-4" />
                                        {logoPreview ? "Logo ändern" : "Logo hochladen"}
                                    </>
                                )}
                            </Button>
                        </label>
                        <p className="text-sm text-muted-foreground">
                            PNG oder JPG, max. 5MB
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <Button type="submit" disabled={isPending}>
                        {isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Speichern...
                            </>
                        ) : (
                            "Einstellungen speichern"
                        )}
                    </Button>
                </div>
            </form>
        </Form>
    );
}

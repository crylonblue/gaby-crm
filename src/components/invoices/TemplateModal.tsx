"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { UNITS, getUnitLabel } from "../../../lib/units";
import { createTemplate, updateTemplate } from "@/lib/actions/template.actions";
import { type Template } from "@/db/schema";
import { toast } from "sonner";
import { useTransition } from "react";

const templateSchema = z.object({
    name: z.string().min(1, "Name ist erforderlich"),
    description: z.string().optional(),
    unit: z.string().min(1, "Einheit ist erforderlich"),
    unitPrice: z.number().min(0, "Preis muss positiv sein"),
    defaultVatRate: z.number().min(0).max(100, "MwSt. muss zwischen 0 und 100 sein"),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

interface TemplateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    template?: Template | null;
    onSelect?: (template: Template) => void;
}

export function TemplateModal({ open, onOpenChange, template, onSelect }: TemplateModalProps) {
    const [isPending, startTransition] = useTransition();
    const [unitOpen, setUnitOpen] = useState(false);

    const form = useForm<TemplateFormValues>({
        resolver: zodResolver(templateSchema),
        defaultValues: {
            name: "",
            description: "",
            unit: "piece",
            unitPrice: 0,
            defaultVatRate: 19,
        },
    });

    // Reset form when template changes
    useEffect(() => {
        if (template) {
            form.reset({
                name: template.name,
                description: template.description || "",
                unit: template.unit,
                unitPrice: template.unitPrice,
                defaultVatRate: template.defaultVatRate,
            });
        } else {
            form.reset({
                name: "",
                description: "",
                unit: "piece",
                unitPrice: 0,
                defaultVatRate: 19,
            });
        }
    }, [template, open]);

    const onSubmit = (data: TemplateFormValues) => {
        startTransition(async () => {
            if (template) {
                // Update existing template
                const result = await updateTemplate(template.id, data);
                if (result.success) {
                    toast.success("Vorlage aktualisiert");
                    onOpenChange(false);
                } else {
                    toast.error(result.error || "Fehler beim Aktualisieren");
                }
            } else {
                // Create new template
                const result = await createTemplate(data);
                if (result.success && result.template) {
                    toast.success("Vorlage erstellt");
                    onOpenChange(false);
                    // If onSelect callback provided, select the newly created template
                    if (onSelect) {
                        onSelect(result.template);
                    }
                } else {
                    toast.error(result.error || "Fehler beim Erstellen");
                }
            }
        });
    };

    const selectedUnit = form.watch("unit");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>
                        {template ? "Vorlage bearbeiten" : "Neue Vorlage erstellen"}
                    </DialogTitle>
                    <DialogDescription>
                        Erstellen Sie eine wiederverwendbare Vorlage für Rechnungspositionen.
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name *</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="z.B. Beratung Senior Developer"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Beschreibung</FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="Optionale Beschreibung für die Rechnung"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="unitPrice"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Preis pro Einheit (€) *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="unit"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Einheit *</FormLabel>
                                        <Popover open={unitOpen} onOpenChange={setUnitOpen}>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button
                                                        variant="outline"
                                                        role="combobox"
                                                        className={cn(
                                                            "w-full justify-between",
                                                            !field.value && "text-muted-foreground"
                                                        )}
                                                    >
                                                        {field.value ? getUnitLabel(field.value) : "Einheit auswählen..."}
                                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Einheit suchen..." />
                                                    <CommandList>
                                                        <CommandEmpty>Keine Einheit gefunden.</CommandEmpty>
                                                        <CommandGroup>
                                                            {UNITS.map((unit) => (
                                                                <CommandItem
                                                                    key={unit.value}
                                                                    value={unit.label}
                                                                    onSelect={() => {
                                                                        form.setValue("unit", unit.value);
                                                                        setUnitOpen(false);
                                                                    }}
                                                                >
                                                                    <Check
                                                                        className={cn(
                                                                            "mr-2 h-4 w-4",
                                                                            selectedUnit === unit.value
                                                                                ? "opacity-100"
                                                                                : "opacity-0"
                                                                        )}
                                                                    />
                                                                    {unit.label}
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
                        </div>

                        <FormField
                            control={form.control}
                            name="defaultVatRate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Standard-MwSt. (%)</FormLabel>
                                    <FormControl>
                                        <Input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            max="100"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={isPending}
                            >
                                Abbrechen
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Speichern...
                                    </>
                                ) : template ? (
                                    "Aktualisieren"
                                ) : (
                                    "Erstellen & Auswählen"
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

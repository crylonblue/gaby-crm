"use client";

import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, Trash2, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { UNITS, getUnitLabel } from "../../../lib/units";
import { TemplateSelector } from "./TemplateSelector";
import { TemplateModal } from "./TemplateModal";
import { type Template } from "@/db/schema";

export interface LineItem {
    id: string;
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    vatRate: number;
    total: number;
}

interface NumberInputProps {
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    className?: string;
    placeholder?: string;
}

function NumberInput({ value, onChange, min, max, className, placeholder }: NumberInputProps) {
    const [localValue, setLocalValue] = useState(value.toString());

    // Sync with external value changes
    React.useEffect(() => {
        setLocalValue(value.toString());
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const input = e.target.value;
        // Allow empty, numbers, and decimal point/comma
        if (input === '' || /^-?\d*[.,]?\d*$/.test(input)) {
            setLocalValue(input);
        }
    };

    const handleBlur = () => {
        // Convert comma to dot for parsing
        const normalized = localValue.replace(',', '.');
        let numValue = parseFloat(normalized);

        // Handle invalid or empty input
        if (isNaN(numValue)) {
            numValue = 0;
        }

        // Apply min/max constraints
        if (min !== undefined && numValue < min) numValue = min;
        if (max !== undefined && numValue > max) numValue = max;

        setLocalValue(numValue.toString());
        onChange(numValue);
    };

    return (
        <Input
            type="text"
            inputMode="decimal"
            value={localValue}
            onChange={handleChange}
            onBlur={handleBlur}
            onFocus={(e) => e.target.select()}
            className={className}
            placeholder={placeholder}
        />
    );
}

interface LineItemsEditorProps {
    lineItems: LineItem[];
    onChange: (items: LineItem[]) => void;
}

export function LineItemsEditor({ lineItems, onChange }: LineItemsEditorProps) {
    const [templateModalOpen, setTemplateModalOpen] = useState(false);
    const [pendingTemplateItemId, setPendingTemplateItemId] = useState<string | null>(null);
    const addLineItem = () => {
        const newItem: LineItem = {
            id: crypto.randomUUID(),
            description: '',
            quantity: 0,
            unit: 'piece',
            unitPrice: 0,
            vatRate: 19,
            total: 0,
        };
        onChange([...lineItems, newItem]);
    };

    const updateLineItem = (id: string, updates: Partial<LineItem>) => {
        const updated = lineItems.map((item) => {
            if (item.id === id) {
                const updatedItem = { ...item, ...updates };
                // Recalculate total
                updatedItem.total = updatedItem.quantity * updatedItem.unitPrice;
                return updatedItem;
            }
            return item;
        });
        onChange(updated);
    };

    const removeLineItem = (id: string) => {
        onChange(lineItems.filter((item) => item.id !== id));
    };

    const handleTemplateSelect = (itemId: string, template: Template) => {
        updateLineItem(itemId, {
            description: template.description || template.name,
            unit: template.unit,
            unitPrice: template.unitPrice,
            vatRate: template.defaultVatRate,
        });
    };

    const handleNewTemplateFromModal = (template: Template) => {
        if (pendingTemplateItemId) {
            handleTemplateSelect(pendingTemplateItemId, template);
            setPendingTemplateItemId(null);
        }
        setTemplateModalOpen(false);
    };

    return (
        <div className="space-y-4">
            {lineItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                    Noch keine Positionen hinzugefügt.
                </p>
            ) : (
                <div className="space-y-3">
                    {lineItems.map((item, index) => (
                        <LineItemCard
                            key={item.id}
                            item={item}
                            index={index}
                            onUpdate={(updates) => updateLineItem(item.id, updates)}
                            onRemove={() => removeLineItem(item.id)}
                            onTemplateSelect={(template) => handleTemplateSelect(item.id, template)}
                            onOpenModal={() => {
                                setPendingTemplateItemId(item.id);
                                setTemplateModalOpen(true);
                            }}
                        />
                    ))}
                </div>
            )}

            <Button
                type="button"
                variant="outline"
                onClick={addLineItem}
                className="w-full"
            >
                + Position hinzufügen
            </Button>

            <TemplateModal
                open={templateModalOpen}
                onOpenChange={setTemplateModalOpen}
                onSelect={handleNewTemplateFromModal}
            />
        </div>
    );
}

interface LineItemCardProps {
    item: LineItem;
    index: number;
    onUpdate: (updates: Partial<LineItem>) => void;
    onRemove: () => void;
    onTemplateSelect: (template: Template) => void;
    onOpenModal: () => void;
}

function LineItemCard({ item, index, onUpdate, onRemove, onTemplateSelect, onOpenModal }: LineItemCardProps) {
    const [unitOpen, setUnitOpen] = useState(false);
    const [templateOpen, setTemplateOpen] = useState(false);

    return (
        <div className="rounded-md border bg-card p-4">
            <div className="mb-3 flex items-start justify-between">
                <span className="text-xs font-medium text-muted-foreground">
                    Position {index + 1}
                </span>
                <div className="flex items-center gap-2">
                    {/* Template Button */}
                    <Popover open={templateOpen} onOpenChange={setTemplateOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                            >
                                <FileText className="h-3 w-3 mr-1" />
                                Vorlage
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-0" align="end">
                            <TemplateSelector
                                onSelect={(template) => {
                                    onTemplateSelect(template);
                                    setTemplateOpen(false);
                                }}
                                onOpenModal={() => {
                                    setTemplateOpen(false);
                                    onOpenModal();
                                }}
                            />
                        </PopoverContent>
                    </Popover>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={onRemove}
                        className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <div className="space-y-3">
                {/* Description */}
                <div>
                    <label className="block text-xs font-medium mb-1">
                        Beschreibung *
                    </label>
                    <Input
                        type="text"
                        value={item.description}
                        onChange={(e) => onUpdate({ description: e.target.value })}
                        placeholder="z.B. Beratungsleistung, Webentwicklung..."
                    />
                </div>

                {/* Quantity and Unit */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium mb-1">
                            Menge *
                        </label>
                        <NumberInput
                            value={item.quantity}
                            onChange={(quantity) => onUpdate({ quantity })}
                            min={0}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">
                            Einheit *
                        </label>
                        <Popover open={unitOpen} onOpenChange={setUnitOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={unitOpen}
                                    className="w-full justify-between"
                                >
                                    {getUnitLabel(item.unit)}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
                                <Command>
                                    <CommandInput placeholder="Einheit suchen..." />
                                    <CommandList className="max-h-[200px]">
                                        <CommandEmpty>Keine Einheit gefunden.</CommandEmpty>
                                        <CommandGroup>
                                            {UNITS.map((unit) => {
                                                const isSelected = item.unit === unit.value;
                                                return (
                                                    <CommandItem
                                                        key={unit.value}
                                                        value={unit.label}
                                                        onSelect={() => {
                                                            onUpdate({ unit: unit.value });
                                                            setUnitOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                'mr-2 h-4 w-4',
                                                                isSelected ? 'opacity-100' : 'opacity-0'
                                                            )}
                                                        />
                                                        {unit.label}
                                                    </CommandItem>
                                                );
                                            })}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </div>

                {/* Price and VAT */}
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium mb-1">
                            Einzelpreis (€) *
                        </label>
                        <NumberInput
                            value={item.unitPrice}
                            onChange={(unitPrice) => onUpdate({ unitPrice })}
                            min={0}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium mb-1">
                            MwSt. %
                        </label>
                        <NumberInput
                            value={item.vatRate}
                            onChange={(vatRate) => onUpdate({ vatRate })}
                            min={0}
                            max={100}
                        />
                    </div>
                </div>

                {/* Total */}
                <div className="text-right pt-2 border-t">
                    <p className="text-sm font-medium">
                        Gesamt:{' '}
                        {new Intl.NumberFormat('de-DE', {
                            style: 'currency',
                            currency: 'EUR',
                        }).format(item.total)}
                    </p>
                </div>
            </div>
        </div>
    );
}

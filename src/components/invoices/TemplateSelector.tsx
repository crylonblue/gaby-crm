"use client";

import { useState, useEffect } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUnitLabel } from "../../../lib/units";
import { getTemplates, type Template } from "@/lib/actions/template.actions";

interface TemplateSelectorProps {
    selectedTemplateId?: number;
    onSelect: (template: Template) => void;
    onOpenModal: () => void;
}

export function TemplateSelector({
    selectedTemplateId,
    onSelect,
    onOpenModal,
}: TemplateSelectorProps) {
    const [templates, setTemplates] = useState<Template[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        loadTemplates();
    }, []);

    const loadTemplates = async () => {
        setIsLoading(true);
        const data = await getTemplates();
        setTemplates(data);
        setIsLoading(false);
    };

    const filteredTemplates = templates.filter((template) =>
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false)
    );

    const handleSelectTemplate = (template: Template) => {
        onSelect(template);
        setSearchQuery("");
    };

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("de-DE", {
            style: "currency",
            currency: "EUR",
        }).format(price);
    };

    return (
        <Command className="flex flex-col">
            <CommandInput
                placeholder="Vorlage suchen..."
                value={searchQuery}
                onValueChange={setSearchQuery}
            />
            <CommandList className="flex-1 max-h-[200px] overflow-y-auto">
                <CommandEmpty>
                    {isLoading ? "Lädt..." : "Keine Vorlagen gefunden."}
                </CommandEmpty>
                <CommandGroup>
                    {filteredTemplates.map((template) => {
                        const isSelected = selectedTemplateId === template.id;
                        return (
                            <CommandItem
                                key={template.id}
                                value={template.name}
                                onSelect={() => handleSelectTemplate(template)}
                            >
                                <Check
                                    className={cn(
                                        "mr-2 h-4 w-4",
                                        isSelected ? "opacity-100" : "opacity-0"
                                    )}
                                />
                                <div className="flex flex-col">
                                    <span>{template.name}</span>
                                    <span className="text-xs text-muted-foreground">
                                        {formatPrice(template.unitPrice)} / {getUnitLabel(template.unit)}
                                    </span>
                                </div>
                            </CommandItem>
                        );
                    })}
                </CommandGroup>
            </CommandList>
            <div className="border-t p-1 flex-shrink-0">
                <Button
                    type="button"
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={onOpenModal}
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Neue Vorlage erstellen
                </Button>
            </div>
        </Command>
    );
}

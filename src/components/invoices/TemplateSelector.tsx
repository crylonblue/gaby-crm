"use client";

import { useState, useEffect, useTransition } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Check, Plus, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUnitLabel } from "../../../lib/units";
import { getTemplates, deleteTemplate } from "@/lib/actions/template.actions";
import { type Template } from "@/db/schema";
import { toast } from "sonner";

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
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [isPending, startTransition] = useTransition();

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

    const handleDeleteTemplate = async (e: React.MouseEvent, templateId: number, templateName: string) => {
        e.stopPropagation(); // Prevent selecting the template
        
        if (!confirm(`Vorlage "${templateName}" wirklich löschen?`)) {
            return;
        }

        setDeletingId(templateId);
        startTransition(async () => {
            const result = await deleteTemplate(templateId);
            if (result.success) {
                toast.success("Vorlage gelöscht");
                // Remove from local state
                setTemplates(templates.filter(t => t.id !== templateId));
            } else {
                toast.error(result.error || "Fehler beim Löschen");
            }
            setDeletingId(null);
        });
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
                        const isDeleting = deletingId === template.id;
                        return (
                            <CommandItem
                                key={template.id}
                                value={template.name}
                                onSelect={() => handleSelectTemplate(template)}
                                className="flex items-center justify-between group"
                            >
                                <div className="flex items-center">
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4 flex-shrink-0",
                                            isSelected ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{template.name}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {formatPrice(template.unitPrice)} / {getUnitLabel(template.unit)}
                                        </span>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={(e) => handleDeleteTemplate(e, template.id, template.name)}
                                    disabled={isDeleting || isPending}
                                >
                                    {isDeleting ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-3 w-3" />
                                    )}
                                </Button>
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

---
title: "Tabelle: templates"
tags: [database, schema]
---

# Tabelle `templates`

Wiederverwendbare Rechnungspositionen, die beim Erstellen einer Rechnung schnell übernommen werden können.

## Spalten

| Spalte | Typ | Hinweis |
|---|---|---|
| `id` | integer PK | |
| `name` | text **not null** | Bezeichnung der Vorlage |
| `description` | text | Optionale Beschreibung |
| `unit` | text, default `"piece"` | Einheit (siehe `lib/units.ts`, z. B. `hour`, `km`, `piece`) |
| `unitPrice` | real, default `0` | Einzelpreis netto |
| `defaultVatRate` | real, default `19` | Standard-MwSt-Satz % |
| `createdAt` / `updatedAt` | text **not null** | ISO |

## Verwendung
- CRUD via `template.actions.ts` (`getTemplates`, `getTemplate`, `createTemplate`, `updateTemplate`, `deleteTemplate`).
- UI: `TemplateSelector` + `TemplateModal` im `InvoiceForm`; ausgewählte Vorlage füllt eine Position im `LineItemsEditor`.
- Mutationen revalidieren `/invoices/new`.

## Verwandt
- [[Invoice Templates]] · [[Invoice Calculation]] · [[Database Overview]]

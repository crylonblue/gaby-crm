---
title: Invoice Templates
tags: [feature]
---

# Invoice Templates

Wiederkehrende Leistungspositionen lassen sich als Vorlage speichern und beim Erstellen einer Rechnung übernehmen. Tabelle [[templates]], Actions in `template.actions.ts`.

## Eine Vorlage besteht aus
- `name`, optionale `description`
- `unit` (Einheit, siehe `lib/units.ts`)
- `unitPrice` (netto)
- `defaultVatRate` (Standard 19 %)

## UI-Fluss
1. Im `InvoiceForm` öffnet der `TemplateSelector` die Liste vorhandener Vorlagen.
2. `TemplateModal` erlaubt Anlegen/Bearbeiten.
3. Auswahl füllt eine Zeile im `LineItemsEditor` (Beschreibung, Einheit, Preis, MwSt) vor.

Die übernommenen Positionen landen anschließend als `lineItemsJson` in der Rechnung — siehe [[Invoice Calculation]].

## Verwandt
- [[templates]] · [[Invoice Calculation]] · [[Invoice Management]]

---
title: Invoice Numbering
tags: [invoicing]
---

# Invoice Numbering

Rechnungsnummern haben das Format **`YYYY-MM-XXXX`** und werden pro Monat fortlaufend vergeben. Logik: `generateInvoiceNumber(date)` in `src/lib/invoice-helpers.ts`.

## Algorithmus
1. Datum auf `YYYY-MM-DD` normalisieren, `year` und `month` extrahieren.
2. Alle bestehenden `invoiceNumber` für diesen Monat suchen: `LIKE 'YYYY-MM-%'`.
3. Mit Regex `^\d{4}-\d{2}-(\d+)$` die laufende Nummer parsen und das Maximum bestimmen.
4. `maxSequence + 1`, auf **4 Stellen** mit führenden Nullen formatieren.
5. Ergebnis z. B. `2026-06-0001`.

Wenn `createInvoice` bereits eine `invoiceNumber` mitbekommt, wird diese beibehalten; sonst wird sie generiert.

## Hinweise / Risiken
- Keine DB-seitige Eindeutigkeit/Transaktion → bei gleichzeitigem Erstellen theoretisch Race möglich (für einen Einzelnutzer praktisch unkritisch). Siehe [[Known Issues and Security]].
- Beim Bearbeiten ohne vorhandene Nummer wird eine neue generiert und gespeichert.

## Verwandt
- [[invoices]] · [[Invoice Management]]

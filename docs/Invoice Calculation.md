---
title: Invoice Calculation
tags: [invoicing]
---

# Invoice Calculation

Die Brutto-Summe einer Rechnung wird zentral in `src/lib/invoice-utils.ts` via `calculateInvoiceGrossAmount(invoice)` berechnet. Sie wird für [[Budget Tracking|Budget]] und Monatsumsatz genutzt.

## Zwei Datenquellen

### 1. `lineItemsJson` (bevorzugt)
JSON-Array von Positionen, je Position:
```ts
{ description, quantity, unit, unitPrice, vatRate }
```
Berechnung:
```
netto  = Σ (quantity * unitPrice)
mwst   = Σ (quantity * unitPrice * vatRate/100)   // vatRate default 19, wenn ungültig
brutto = netto + mwst
```
Jede Position kann einen **eigenen MwSt-Satz** haben.

### 2. Legacy hours/km (Fallback)
Wenn keine `lineItemsJson` vorhanden/parsebar:
```
brutto = ((hours * ratePerHour) + (km * ratePerKm)) * 1.19   // pauschal 19 %
```

## Mapping fürs Dokument
`mapDbInvoiceToInvoice` (`invoice-helpers.ts`) erzeugt aus dem DB-Datensatz die `InvoiceItem[]`:
- aus `lineItemsJson`, mit robustem Parsen des `vatRate` (Default 19, gültiger Bereich 0–100);
- sonst Legacy: eine Stunden-Position (`unit: "hour"`), optional eine Fahrtkosten-Position (`unit: "km"`, Beschreibung „Fahrtkosten"), sonst eine Default-Position.

## Rundung (ZUGFeRD)
Im `zugferd-generator.ts` werden Netto/MwSt/Brutto auf 2 Nachkommastellen gerundet und pro MwSt-Satz gruppiert (VAT-Breakdown mit `categoryCode` `S`/`Z`). Siehe [[XRechnung and ZUGFeRD]].

## Einheiten
`lib/units.ts` mappt Einheiten (`hour`, `day`, `piece`, `km`, `kg`, `month`, `meter`, `liter`, `gram`) auf deutsche Labels und **UN/ECE-Codes** (z. B. `HUR`, `KMT`, `C62`) für ZUGFeRD.

## Verwandt
- [[invoices]] · [[Budget Tracking]] · [[XRechnung and ZUGFeRD]] · [[PDF Generation]]

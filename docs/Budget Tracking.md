---
title: Budget Tracking
tags: [feature]
---

# Budget Tracking

Pro Kunde wird der im Jahr **abgerechnete** Betrag nachgehalten ("Abgerechnet" / Jahresbudget). Außerdem zeigt das Dashboard den Monatsumsatz.

## Was zählt als "abgerechnet"?
**Alle erstellten Rechnungen** des Jahres zählen — unabhängig vom Versandstatus (`sentAt` spielt fürs Budget **keine** Rolle mehr). Der Betrag ist der **Brutto-Betrag** via `calculateInvoiceGrossAmount` (siehe [[Invoice Calculation]]).

> 📌 **Geändert:** Früher zählten nur versendete Rechnungen (`sentAt != null`). Seit der Umstellung fließen alle erstellten Rechnungen ein. Stornorechnungen haben negative Beträge und **verrechnen** sich dadurch automatisch mit dem Original. Siehe [[Invoice Lifecycle]].

## Zwei parallele Berechnungswege

1. **On-the-fly (UI-relevant):** `getCustomers`/`getCustomer` rufen `getYearlyBilledAmountFromInvoices` und liefern `yearlyBudget` für das **laufende** Jahr. Diese Zahl sieht der Nutzer in der Kunden-UI.

2. **Persistierter Cache:** `recalcCustomerBudgetFromInvoices` schreibt die Jahressumme in die Tabelle [[customer_budgets]]. Aufgerufen bei `createInvoice`, `updateInvoice` und im [[Webhooks|Versand-Webhook]].

> ⚠️ Beide Wege berechnen dasselbe (Summe **aller** Rechnungen pro Jahr), aber die UI liest **nicht** aus `customer_budgets`. Die Tabelle ist damit aktuell redundant. Wenn man künftig aus der Tabelle lesen will, ist sie bereits konsistent gepflegt.

## Filterlogik
- Jahr: `date LIKE '<year>-%'`
- **Kein** Versandfilter mehr (alle erstellten Rechnungen)
- (in `customer.actions` identisch wie in `invoice.actions`)

## Monatsumsatz — `getMonthlyTurnover()`
- Bestimmt das "aktuelle" Jahr/Monat in **`Europe/Berlin`**.
- Filtert `date LIKE '<YYYY>-<MM>%'` und summiert `calculateInvoiceGrossAmount`.
- Zählt **alle** Rechnungen des Monats (gleiche Semantik wie das Kunden-Budget).
- Dargestellt im `TurnoverCard` auf dem Dashboard.

## Verwandt
- [[customer_budgets]] · [[invoices]] · [[Invoice Calculation]] · [[Invoice Lifecycle]]

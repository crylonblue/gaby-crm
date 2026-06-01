---
title: "Tabelle: customer_budgets"
tags: [database, schema]
---

# Tabelle `customer_budgets`

Pro Kunde und Jahr ein Datensatz mit dem aufsummierten Betrag **aller erstellten Rechnungen**.

## Spalten

| Spalte | Typ | Hinweis |
|---|---|---|
| `id` | integer PK | |
| `customerId` | integer **not null** | Verweis auf [[customers]] |
| `year` | integer **not null** | Budgetjahr |
| `amount` | real, default `0` | Summe der Brutto-Beträge aller erstellten Rechnungen |

## Wie es gepflegt wird

`amount` wird **abgeleitet** (nicht inkrementell): die Funktion `recalcCustomerBudgetFromInvoices` summiert **alle** Rechnungen des Kunden, deren `date` im Jahr liegt (`calculateInvoiceGrossAmount`), und schreibt das Ergebnis via Upsert. Ein Versandfilter (`sentAt`) wird **nicht** mehr angewandt.

Aufgerufen bei: Rechnung erstellen, bearbeiten ([[Invoice Management]]) und im Versand-Callback ([[Webhooks]]).

> ⚠️ **Redundanz-Hinweis:** Die Kunden-Actions `getCustomers`/`getCustomer` lesen das Budget **nicht** aus dieser Tabelle, sondern berechnen `yearlyBudget` jedes Mal frisch aus den Rechnungen. Die Tabelle ist damit ein optionaler Cache/Altlast und wird derzeit von der Kunden-UI nicht gelesen. Siehe [[Budget Tracking]].

## Verwandt
- [[Budget Tracking]] · [[invoices]] · [[Database Overview]]

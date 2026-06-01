---
title: Customer Management
tags: [feature]
---

# Customer Management

Verwaltung der Patienten/Pflegekunden. Server Actions in `src/lib/actions/customer.actions.ts`, Tabelle [[customers]].

## Funktionen (Server Actions)

| Action | Zweck |
|---|---|
| `getCustomers()` | Alle Kunden (absteigend nach `id`) inkl. berechnetem `yearlyBudget` des laufenden Jahres |
| `getCustomer(id)` | Einzelner Kunde inkl. `yearlyBudget` |
| `createCustomer(data)` | Anlegen → revalidate `/customers` |
| `updateCustomer(id, data)` | Aktualisieren → revalidate `/customers` + Edit-Seite |
| `deleteCustomer(id)` | Löschen → revalidate `/customers` |
| `importCustomers(data[])` | Bulk-Insert (CSV-Import) |

`yearlyBudget` = Summe der Brutto-Beträge **aller erstellten** Rechnungen des laufenden Jahres (kein Versandfilter) — siehe [[Budget Tracking]].

## CSV-Import
- Seite `/customers/import`, Parsing mit **papaparse**.
- `importCustomers` macht ein direktes `db.insert(...).values(data)` (Bulk). Hinweis im Code: bei sehr großen Importen müsste man wegen SQLite-Variablen-Limit chunken.

## UI-Komponenten
`CustomerForm` (Anlegen/Bearbeiten), `FilteredCustomerList` + `CustomerRow` (Liste mit Suche), `DeleteCustomerDialog`.

## Verwandt
- [[customers]] · [[Budget Tracking]] · [[File Uploads]] · [[Invoice Management]]

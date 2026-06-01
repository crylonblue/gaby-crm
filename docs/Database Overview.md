---
title: Database Overview
tags: [database]
---

# Database Overview

- **Engine:** Turso (LibSQL, SQLite-kompatibel) in der Cloud.
- **Client:** `@libsql/client` → Drizzle ORM (`src/db/index.ts`).
- **Schema:** `src/db/schema.ts` (Drizzle).
- **Verbindung:** über `TURSO_DATABASE_URL` (+ optional `TURSO_AUTH_TOKEN`). Wirft beim Start, wenn die URL fehlt. Siehe [[Environment Variables]].
- Eine lokale `sqlite.db` liegt im Repo (Dev/Tooling via `better-sqlite3`).

## Tabellen

| Tabelle | Zweck | Note |
|---|---|---|
| `customers` | Stammdaten der Patienten | [[customers]] |
| `invoices` | Rechnungen inkl. Kunden-Snapshot | [[invoices]] |
| `customer_budgets` | Jahresbudget-Cache pro Kunde | [[customer_budgets]] |
| `seller_settings` | Firmen-/Bank-/Steuerdaten (Single-Row) | [[seller_settings]] |
| `templates` | Wiederverwendbare Rechnungspositionen | [[templates]] |

## Beziehungen

Es gibt **keine** deklarierten Foreign Keys/Relations in Drizzle — Verknüpfungen erfolgen über `customerId`-Felder und werden in der Anwendung manuell aufgelöst.

```
customers (1) ───< invoices (customerId)
customers (1) ───< customer_budgets (customerId, year)
seller_settings (genau 1 Zeile)
templates (eigenständig)
```

## Typen (aus Schema abgeleitet)

`Customer`/`NewCustomer`, `Invoice`/`NewInvoice`, `CustomerBudget`/`NewCustomerBudget`, `SellerSettings`/`NewSellerSettings`, `Template`/`NewTemplate`.

## Verwandt
- [[Migrations]]
- [[Architecture Overview]]

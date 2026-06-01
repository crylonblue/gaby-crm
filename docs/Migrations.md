---
title: Migrations
tags: [database, ops]
---

# Migrations

Migrationen liegen in `drizzle/` und werden mit **Drizzle Kit** erzeugt.

## Konfiguration (`drizzle.config.ts`)
- `schema: ./src/db/schema.ts`
- `out: ./drizzle`
- `dialect: "turso"`
- Credentials aus `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` (via `dotenv`).

## Befehle
```bash
npx drizzle-kit generate   # neue Migration aus Schema-Änderungen
npx drizzle-kit push       # Schema direkt in die DB pushen
```

## Migrationsverlauf

Im Journal (`drizzle/meta/_journal.json`) registriert: `0000` – `0008`.

Zusätzlich existieren als SQL-Dateien, aber **nicht im Journal**:
- `0009_add_email_and_xrechnung_fields.sql`
- `0010_add_insurance_address.sql`
- `0011_insurance_structured_address.sql`
- `0012_add_invoice_cancellation.sql` — Spalten `cancels_invoice_id`, `cancelled_by_invoice_id` ([[Invoice Cancellation (Storno)]])
- `0013_add_seller_ik_number.sql` — Spalte `seller_settings.ik_number` ([[Seller Settings]])

> ⚠️ Diese wurden **außerhalb** des regulären Drizzle-Flows angewandt. `scripts/run-migration.ts` führt eine Migration gegen Turso aus (liest die Datei, splittet an `;`, führt Statement für Statement aus). Standardziel ist `0012_add_invoice_cancellation.sql`; ein anderer Dateiname kann als Argument übergeben werden:
> ```bash
> npx tsx scripts/run-migration.ts                       # wendet 0012 an
> npx tsx scripts/run-migration.ts 0011_insurance_structured_address.sql
> ```
> Beim Aufsetzen einer frischen DB muss man darauf achten, auch `0009`–`0013` einzuspielen.

## Verwandt
- [[Database Overview]] · [[Development Setup]]

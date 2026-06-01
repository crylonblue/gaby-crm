# GABY-CRM — Projektkontext

> ℹ️ **Die vollständige Dokumentation liegt jetzt als Obsidian-Vault in [`docs/`](./docs/).**
> Einstiegspunkt: [`docs/Home.md`](./docs/Home.md). Diese Datei ist nur noch eine Kurzfassung, um Drift zu vermeiden — Details bitte in der Vault pflegen.

## Was ist das?
CRM- & Rechnungssystem für einen **deutschen Pflegedienst** (UI deutsch). Verwaltet Patienten/Kunden und erstellt Rechnungen an deren **Krankenkassen** — inkl. PDF und **XRechnung/ZUGFeRD** (EN16931, BR-DE).
→ `docs/Project Overview.md`

## Tech-Stack (Kurz)
Next.js 16 (App Router) · React 19 · TypeScript 5 · Turso (LibSQL) + Drizzle ORM · Tailwind 4 + shadcn/ui · React Hook Form + Zod · pdf-lib · node-zugferd · AWS S3 / Cloudflare R2 · papaparse.
→ `docs/Tech Stack.md`

## Wichtigste Konzepte
- **Empfänger** jeder Rechnung ist die **Krankenkasse** (Buyer), nicht der Patient. → `docs/invoices.md`, `docs/XRechnung and ZUGFeRD.md`
- **Budget / „Abgerechnet"** = Summe der **versendeten** Rechnungen (`sentAt != null`) pro Jahr. → `docs/Budget Tracking.md`
- **Positionen** liegen als `lineItemsJson`; `hours`/`km`/`rate*` sind Legacy-Fallback. → `docs/Invoice Calculation.md`
- **Versand** über externen Worker-Webhook + Callback-API `/api/invoices/webhook`. → `docs/Webhooks.md`
- **Status** `offen` / `bezahlt` / `storniert` (+ Flags `paid`, `queuedForSending`, `sentAt`). → `docs/Invoice Lifecycle.md`
- **Kein Löschen:** Rechnungen werden storniert (automatische Stornorechnung + gesperrter Status). → `docs/Invoice Cancellation (Storno).md`

## Struktur (Kurz)
- `src/app/(dashboard)/**` — Seiten · `src/app/api/**` — API-Routen
- `src/lib/actions/*.actions.ts` — Server Actions (customer, invoice, seller, template, upload)
- `src/lib/invoice-*.ts` — Rechnungsberechnung & -Mapping
- `lib/` (Top-Level) — `pdf-generator.ts`, `zugferd-generator.ts`, `s3.ts`, `schema.ts`, `units.ts`
- `src/db/schema.ts` — Tabellen: customers, invoices, customer_budgets, seller_settings, templates
- `drizzle/` — Migrationen (Journal 0000–0008; 0009–0011 manuell, siehe `docs/Migrations.md`)
→ `docs/Architecture Overview.md`, `docs/Routing and Pages.md`

## Bekannte Risiken
Hartkodiertes Login-Passwort, ungeschützte `/api/*`-Routen, hartkodierte Webhook-URL, redundante `customer_budgets`-Tabelle, Migrations-Drift.
→ `docs/Known Issues and Security.md`

## Env-Variablen
Turso (`TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`), S3/R2 (`S3_*`), optional `SKIP_S3_UPLOAD`, `SELLER_*`-Fallbacks.
→ `docs/Environment Variables.md`

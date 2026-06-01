---
title: Architecture Overview
tags: [architecture]
---

# Architecture Overview

GABY-CRM ist eine **Next.js 16 App-Router**-Anwendung. Die UI besteht aus Server Components, mutierende Logik läuft über **Server Actions**; ein kleiner Teil ist als **API-Routen** für externe Systeme exponiert.

## Schichten

```
┌─────────────────────────────────────────────┐
│  UI: Server + Client Components              │
│  src/app/(dashboard)/**, src/components/**   │
└───────────────┬─────────────────────────────┘
                │ ruft auf
┌───────────────▼─────────────────────────────┐
│  Server Actions ("use server")               │
│  src/lib/actions/*.actions.ts                │
│  customer · invoice · seller · template ·    │
│  upload                                      │
└───────────────┬─────────────────────────────┘
                │ nutzt
┌───────────────▼─────────────────────────────┐
│  Domain-Helfer                               │
│  src/lib/invoice-helpers.ts                  │
│  src/lib/invoice-utils.ts                    │
│  lib/pdf-generator.ts · lib/zugferd-*.ts     │
│  lib/s3.ts · lib/units.ts · lib/schema.ts    │
└───────────────┬─────────────────────────────┘
                │ DB / extern
┌───────────────▼─────────────────────────────┐
│  Drizzle ORM → Turso (LibSQL)                │
│  AWS S3 / Cloudflare R2                      │
│  Externer Versand-Worker (Webhook)           │
└─────────────────────────────────────────────┘

  Externe Systeme ──HTTP──► API-Routen
  src/app/api/** (auth, invoices, webhook)
```

## Wichtige Verzeichnisse

| Pfad | Inhalt |
|---|---|
| `src/app/(auth)/login` | Login-Seite ([[Authentication]]) |
| `src/app/(dashboard)/**` | Geschützte Seiten ([[Routing and Pages]]) |
| `src/app/api/**` | API-Routen ([[Server Actions and API]]) |
| `src/components/**` | UI-Komponenten (customers, invoices, dashboard, layout, settings, ui) |
| `src/lib/actions/**` | Server Actions |
| `src/lib/invoice-*.ts` | Rechnungs-Helfer & -Berechnung |
| `src/db/**` | Drizzle-Schema & DB-Client |
| `lib/**` | Generatoren (PDF, ZUGFeRD), S3, Zod-Schema, Units, Übersetzungen |
| `drizzle/**` | Migrationen ([[Migrations]]) |

> Hinweis: Es gibt **zwei `lib`-Ordner** — `src/lib/` (App-nahe Helfer & Actions) und das Top-Level `lib/` (Generatoren/Infra wie `pdf-generator.ts`, `zugferd-generator.ts`, `s3.ts`, `schema.ts`). Importe ins Top-Level nutzen relative Pfade (`../../../lib/...`), App-interne nutzen `@/`.

## Zwei Datenmodelle für "Rechnung"
- **DB-Modell** `Invoice` (`src/db/schema.ts`) — persistierter Datensatz inkl. Customer-Snapshot.
- **Dokument-Modell** `Invoice` (`lib/schema.ts`, Zod) — die für PDF/XRechnung benötigte Struktur (Seller, Customer, Insurance, Items …).

Die Brücke zwischen beiden ist `mapDbInvoiceToInvoice()` in `src/lib/invoice-helpers.ts`. Siehe [[Invoice Calculation]] und [[XRechnung and ZUGFeRD]].

## Verwandt
- [[Routing and Pages]]
- [[Authentication]]
- [[Server Actions and API]]
- [[Database Overview]]

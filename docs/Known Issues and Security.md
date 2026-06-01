---
title: Known Issues and Security
tags: [security, ops]
---

# Known Issues & Security

Bekannte Schwachstellen und Eigenheiten, geordnet nach Relevanz. Bezieht sich auf den aktuellen Stand des Codes.

## Sicherheit
1. **Hartkodiertes Passwort** `"MeinCRM26!"` in `api/auth/login` — sollte in eine Env-Variable + Hashing. [[Authentication]]
2. **Cookie-Token nicht verifiziert** — geprüft wird nur, *dass* `auth_token` existiert, der Wert ist statisch `"true"`. Kein Session-Secret, keine Signatur.
3. **`/api/*` ist ungeschützt** — die [[Authentication|Middleware]] nimmt alle API-Routen aus. `GET /api/invoices` (Kundendaten!) und `POST /api/invoices/webhook` (Statusänderung) sind ohne Token/Signatur offen erreichbar. [[Webhooks]]
4. **Hartkodierte Webhook-URL** in `sendInvoice` (`https://api.sexy/webhook/...`) — gehört in eine Env-Variable; aktuell umgebungsübergreifend identisch. [[Webhooks]]
5. **Kein Rate-Limiting / CSRF-Schutz** auf Auth- und State-Endpunkten.

## Datenmodell / Konsistenz
6. **Doppelte Budget-Berechnung:** UI berechnet `yearlyBudget` on-the-fly, parallel wird [[customer_budgets]] gepflegt, aber nicht gelesen → Tabelle redundant. [[Budget Tracking]]
7. ~~Monatsumsatz vs. Kundenbudget unterschiedliche Semantik~~ — **behoben:** beide zählen jetzt **alle** erstellten Rechnungen (kein `sentAt`-Filter mehr). [[Budget Tracking]]
8. **Rechnungsnummer ohne DB-Constraint** — `generateInvoiceNumber` ist nicht transaktional/eindeutig abgesichert (Race theoretisch möglich). [[Invoice Numbering]]
9. **Migrations-Drift:** `0009`–`0011` sind nicht im Drizzle-Journal; frische DBs brauchen manuelles Einspielen. [[Migrations]]

## Code-Struktur
10. **Zwei `lib`-Ordner** (`src/lib` vs. Top-Level `lib`) mit relativen `../../../`-Importen — leicht verwechselbar. [[Architecture Overview]]
11. **`@ts-ignore`** in `api/invoices/route.ts` beim dynamischen `where`.
12. **Legacy-Felder** in [[invoices]] (`hours`/`km`/`rate*`) parallel zu `lineItemsJson`.

## Verwandt
- [[Roadmap]] · [[Authentication]] · [[Webhooks]]

---
title: Webhooks
tags: [integration]
---

# Webhooks

Der Versand der Rechnungen läuft **nicht** im Next-Prozess, sondern über einen **externen Worker** (n8n o. Ä.). GABY-CRM stellt Rechnungen in eine Queue und bietet APIs für Abruf & Rückmeldung.

## 1. Versand auslösen (ausgehend)
`sendInvoice(...)` ([[Invoice Management]]):
- setzt `queuedForSending=true`, speichert `invoiceEmail`, `emailSubject`, `emailBody`, optional `abtretungserklaerungUrl`;
- triggert anschließend per `fetch(GET)` einen **fest verdrahteten Webhook**:
  `https://api.sexy/webhook/560f454e-034f-4c1f-b948-3b682fd8ca77`
- Webhook-Fehler sind **nicht fatal** (werden nur geloggt).

> ⚠️ Diese URL ist im Code hartkodiert (`invoice.actions.ts`). Für andere Umgebungen sollte sie in eine Env-Variable wandern. Siehe [[Known Issues and Security]].

## 2. Queue abrufen (eingehend, GET)
`GET /api/invoices` (`src/app/api/invoices/route.ts`) — Filter-Query für den Worker:
- `status`, `from`, `to` (Datum `YYYY-MM-DD`), `queued=true`.
- Beispiel: `GET /api/invoices?queued=true` → alle zu versendenden Rechnungen.

## 3. Status zurückmelden (eingehend, POST)
`POST /api/invoices/webhook` (`src/app/api/invoices/webhook/route.ts`):
- Body: `{ id, invoiceNumber?, url?, action?, queuedForSending? }`.
- `action: "invoice_sent"` → setzt `sentAt = now`, `queuedForSending = false`.
- `invoiceNumber`/`url` aktualisieren `invoiceNumber` bzw. `invoicePdfUrl`.
- `paid`-Status bleibt erhalten.
- Danach Budget-Recalc ([[Budget Tracking]]).

## Sicherheitshinweis
Alle `/api/*`-Routen sind **nicht** durch die [[Authentication|Middleware]] geschützt und ohne Signatur/Token offen. Siehe [[Known Issues and Security]].

## Verwandt
- [[Invoice Lifecycle]] · [[Invoice Management]] · [[Server Actions and API]] · [[Authentication]]

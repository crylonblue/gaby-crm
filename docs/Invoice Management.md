---
title: Invoice Management
tags: [feature]
---

# Invoice Management

Erstellen, bearbeiten, bezahlt-markieren, versenden und löschen von Rechnungen. Server Actions in `src/lib/actions/invoice.actions.ts`, Tabelle [[invoices]].

## Rechnung erstellen — `createInvoice(data)`
1. Rechnungsnummer erzeugen falls fehlend ([[Invoice Numbering]]).
2. Rechnung in DB einfügen, ID über `createdAt` wieder ermitteln.
3. [[Budget Tracking|Budget]] für das Jahr neu berechnen.
4. Falls **nicht** `SKIP_S3_UPLOAD=true`:
   - PDF erzeugen ([[PDF Generation]]) und nach [[S3 Storage|S3]] laden.
   - XRechnung-XML erzeugen ([[XRechnung and ZUGFeRD]]) und nach S3 laden (Fehler hier sind **nicht** fatal).
   - `invoicePdfUrl` + `xrechnungXmlUrl` in der Rechnung speichern.
5. **Rollback bei Fehler:** erzeugte Rechnung wird gelöscht und das Budget zurückgerechnet. Fehler werden in benutzerfreundliche deutsche Meldungen übersetzt (S3-AccessDenied, PDF-Fehler …).

## Rechnung bearbeiten — `updateInvoice(id, data)`
- Aktualisiert die Felder, **regeneriert PDF & XRechnung** neu (außer `SKIP_S3_UPLOAD`).
- Rechnet das Budget für altes und ggf. neues Jahr neu (Datumswechsel berücksichtigt).
- **Nur vor dem Versand möglich:** Sobald `sentAt` gesetzt ist (oder die Rechnung `storniert` ist), lehnt `updateInvoice` ab. Versendete Belege sind festgeschrieben; Korrektur via [[Invoice Cancellation (Storno)|Storno]] + neue Rechnung. Siehe [[Invoice Lifecycle]].

## Bezahlt umschalten — `toggleInvoicePaid(id)`
Setzt `paid` und spiegelt es in `status` (`bezahlt` / `offen`). UI: `TogglePaidButton`.

## Versenden — `sendInvoice({...})`
Siehe [[Invoice Lifecycle]] und [[Webhooks]]: setzt `queuedForSending=true`, speichert Ziel-E-Mail + Betreff/Body, hängt optional die [[File Uploads|Abtretungserklärung]] an und triggert den externen Worker. UI: `SendInvoiceDialog`.

## Stornieren — `cancelInvoice(id)`
Rechnungen werden **nicht gelöscht**, sondern storniert: Es entsteht eine Stornorechnung mit negativen Beträgen, das Original wird auf `storniert` gesperrt. UI: `CancelInvoiceDialog`. Vollständige Beschreibung: [[Invoice Cancellation (Storno)]].

## Lesen
- `getInvoices()` — alle, absteigend nach `date`.
- `getInvoice(id)` — einzelne.
- `getInvoicesForCustomer(customerId)` — alle Rechnungen eines Kunden (für die Kundendetailseite, sortiert nach `date`).
- `getInvoiceCountForCustomer(customerId)` — Anzahl.
- `getMonthlyTurnover()` — Monatsumsatz (Berlin-Zeitzone) fürs Dashboard.

## UI-Komponenten
`InvoiceForm`, `LineItemsEditor` (Positionen, [[Invoice Calculation]]), `TemplateSelector`/`TemplateModal` ([[Invoice Templates]]), `InvoiceListWithSearch`, `MobileInvoiceList`, `SendInvoiceDialog`, `TogglePaidButton`, `CancelInvoiceDialog`.

> Gesperrte (`storniert`) Rechnungen blenden Bearbeiten/Bezahlt/Stornieren aus; `updateInvoice`, `toggleInvoicePaid` und `cancelInvoice` lehnen sie zusätzlich serverseitig ab.

## Verwandt
- [[invoices]] · [[Invoice Lifecycle]] · [[Invoice Calculation]] · [[PDF Generation]] · [[XRechnung and ZUGFeRD]]

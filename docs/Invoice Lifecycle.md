---
title: Invoice Lifecycle
tags: [feature]
---

# Invoice Lifecycle

Der Lebenszyklus einer Rechnung kombiniert ein einfaches `status`-Feld mit zwei Flags (`queuedForSending`, `sentAt`) und dem `paid`-Flag.

## Felder
- `status`: `"offen"` (Default), `"bezahlt"` oder `"storniert"`.
- `paid`: boolean, synchron zu `status` (`toggleInvoicePaid`).
- `queuedForSending`: in der Versand-Queue für den externen [[Webhooks|Worker]].
- `sentAt`: ISO-Zeitstempel des Versands. Dokumentiert **wann** versendet wurde; fürs [[Budget Tracking|Budget]] **nicht** (mehr) relevant — dort zählen alle erstellten Rechnungen.

## Ablauf

```
[erstellt]
   status=offen, paid=false, queuedForSending=false, sentAt=null
   → zählt ab sofort im Budget / "Abgerechnet" ([[Budget Tracking]])
        │  PDF + XRechnung erzeugt & in S3 abgelegt
        ▼
[Versand ausgelöst]  sendInvoice()
   queuedForSending=true, invoiceEmail/emailSubject/emailBody gesetzt
   → externer Worker per Webhook benachrichtigt
        │
        ▼
[Worker arbeitet Queue ab]  GET /api/invoices?queued=true
   → verschickt E-Mail an die Krankenkasse
        │  POST /api/invoices/webhook { action: "invoice_sent", id }
        ▼
[versendet]
   sentAt=<now>, queuedForSending=false
        │  Nutzer markiert Zahlungseingang
        ▼
[bezahlt]  toggleInvoicePaid()
   status=bezahlt, paid=true

  ── alternativ jederzeit ──►
[storniert]  cancelInvoice()
   status=storniert (gesperrt) + neue Stornorechnung mit negativen Beträgen
   → siehe [[Invoice Cancellation (Storno)]]
```

## Hinweise
- Der Webhook bewahrt den `bezahlt`-Status: war eine Rechnung schon bezahlt, bleibt sie es.
- Der Worker kann auch ohne `action` nur `invoiceNumber`/`url` aktualisieren (z. B. PDF-URL nachreichen). Siehe [[Webhooks]].
- **Stornieren ersetzt Löschen:** Rechnungen können nicht gelöscht, nur storniert werden. Eine `storniert`-Rechnung ist gesperrt (kein Bearbeiten/Bezahlt/erneutes Stornieren). Siehe [[Invoice Cancellation (Storno)]].
- Der Versand-Webhook bewahrt den `storniert`-Status (überschreibt ihn nicht mit `offen`/`bezahlt`).

## Verwandt
- [[Invoice Management]] · [[Invoice Cancellation (Storno)]] · [[Webhooks]] · [[Budget Tracking]]

---
title: Invoice Cancellation (Storno)
tags: [feature, invoicing]
---

# Invoice Cancellation (Storno)

Rechnungen werden **nie gelöscht**. Statt zu löschen wird eine **Stornorechnung** (Korrektur-/Reversal-Rechnung) erzeugt und das Original auf Status `storniert` gesetzt und gesperrt. Das entspricht der GoBD-Anforderung der Unveränderbarkeit festgeschriebener Belege.

> Diese Funktion ersetzt das frühere Löschen vollständig — es gibt keine `deleteInvoice`-Action mehr.

## Was beim Stornieren passiert — `cancelInvoice(id)`
(`src/lib/actions/invoice.actions.ts`)

1. Original laden. Ist es bereits `storniert` (oder selbst eine Storno-/stornierte Rechnung), wird abgebrochen.
2. **Stornorechnung** als eigener Datensatz anlegen:
   - eigenes, fortlaufendes [[Invoice Numbering|Rechnungsnummer]] (`YYYY-MM-XXXX`), **datiert auf heute** (Ausstellungsdatum);
   - **negierte Positionen**: alle `lineItemsJson`-Mengen werden negativ (Legacy `hours`/`km` werden rekonstruiert und negiert);
   - **Customer-Snapshot** wird vom Original kopiert;
   - Status `storniert`, `cancelsInvoiceId = original.id`, Beschreibung „Storno zu Rechnung …".
3. PDF + XRechnung der Stornorechnung erzeugen und nach [[S3 Storage|S3]] laden (außer `SKIP_S3_UPLOAD`). Schlägt das fehl, wird die Stornorechnung zurückgerollt und das Original **nicht** verändert.
4. Original sperren: Status `storniert`, `cancelledByInvoiceId = storno.id`.
5. [[Budget Tracking|Budget]] für betroffene Jahre neu berechnen (Original- und Storno-Jahr können abweichen).

Die Stornorechnung wird **nur erzeugt**, nicht automatisch versendet. Der Versand erfolgt bei Bedarf manuell über den normalen Versand-Dialog ([[Webhooks]]).

## Verknüpfungsfelder ([[invoices]])
- `cancelsInvoiceId` — auf der **Stornorechnung**, zeigt auf das Original.
- `cancelledByInvoiceId` — auf dem **Original**, zeigt auf seine Stornorechnung.

## Sperren (Status `storniert`)
| Aktion | Original (storniert) | Stornorechnung | Begründung |
|---|---|---|---|
| Bearbeiten (`updateInvoice`) | ❌ | ❌ | unveränderlich |
| Bezahlt umschalten (`toggleInvoicePaid`) | ❌ | ❌ | gesperrt |
| Erneut stornieren (`cancelInvoice`) | ❌ | ❌ | bereits storniert |
| Versenden (`sendInvoice`) | ❌ | ✅ | Korrektur darf an die Kasse |
| PDF ansehen | ✅ | ✅ | — |

Die UI ([[Routing and Pages|InvoiceListWithSearch / MobileInvoiceList]]) blendet gesperrte Aktionen aus und zeigt ein rotes **„Storniert"**-Badge; die Edit-Seite zeigt statt des Formulars einen Hinweis.

## Budget-Effekt
Da die Stornorechnung negative Beträge hat und das [[Budget Tracking|Budget]] **alle** erstellten Rechnungen summiert, **verrechnen** sich Original und Storno automatisch → der „Abgerechnet"-Betrag des Kunden sinkt korrekt, ohne Sonderfälle.

## Bekannte Einschränkung
Die XRechnung der Stornorechnung nutzt aktuell denselben `typeCode` wie eine normale Rechnung (380), nur mit negativen Beträgen. Streng genommen wäre für eine Korrektur `384` (corrected invoice) bzw. eine Gutschrift `381` korrekt. Siehe [[Roadmap]].

## Verwandt
- [[Invoice Lifecycle]] · [[Invoice Management]] · [[invoices]] · [[Budget Tracking]] · [[XRechnung and ZUGFeRD]]

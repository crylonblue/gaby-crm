---
title: PDF Generation
tags: [invoicing]
---

# PDF Generation

Rechnungs-PDFs werden serverseitig mit **pdf-lib** erzeugt: `generateInvoicePDF(invoice, language)` in `lib/pdf-generator.ts` (~620 Zeilen).

## Eckdaten
- Format **A4** (595.28 × 841.89 pt), Ränder 50 pt, Standardfonts (Helvetica).
- Eingabe ist das **Dokument-Modell** `Invoice` (Zod, `lib/schema.ts`), erzeugt via `mapDbInvoiceToInvoice` ([[Invoice Calculation]]).
- Mehrsprachig: `language: 'de' | 'en'` (Übersetzungen in `lib/invoice-translations.ts`); aktuell wird `'de'` verwendet.
- **Kopfbereich:** Firmenname groß & fett oben links, direkt darunter die **IK-Nummer** (`IK-Nr.: …`, fett) sofern in den [[Seller Settings]] gepflegt; Logo oben rechts. Darunter die kleine graue Absenderzeile.
- Logo wird per `fetchImageAsBytes` von der [[S3 Storage|S3]]-URL geladen und eingebettet (PNG/JPG-Erkennung via Content-Type bzw. Magic Bytes).
- Anrede aus `seller_settings.invoiceGreeting` bzw. Default („Sehr geehrte Damen und Herren,").

## ZUGFeRD-Einbettung
Das erzeugte PDF wird über `embedZugferdIntoPDF` (aus `lib/zugferd-generator.ts`) zu einem **hybriden ZUGFeRD-Dokument** (PDF + eingebettetes XML). Details: [[XRechnung and ZUGFeRD]].

## Wo es aufgerufen wird
- `createInvoice` und `updateInvoice` ([[Invoice Management]]) — danach Upload nach S3 (`invoice-{number}.pdf`).
- Übersprungen, wenn `SKIP_S3_UPLOAD=true` (Testbetrieb, [[Environment Variables]]).

## Verwandt
- [[XRechnung and ZUGFeRD]] · [[Invoice Calculation]] · [[S3 Storage]] · [[Seller Settings]]

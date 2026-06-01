---
title: XRechnung and ZUGFeRD
tags: [invoicing]
---

# XRechnung & ZUGFeRD

GABY-CRM erzeugt elektronische Rechnungen nach **EN16931** mit deutschen **XRechnung**-Geschäftsregeln (BR-DE). Implementierung: `lib/zugferd-generator.ts` (via **node-zugferd**, Profil `EN16931`), Validierung & Zod-Schemas in `lib/schema.ts`.

## Zwei Ausgabeformen
1. **Reines XML** — `generateXRechnungXML(invoice)` → nach [[S3 Storage|S3]] (`xrechnung/{userId}/{invoiceId}/xrechnung.xml`), URL in `invoices.xrechnungXmlUrl`.
2. **Hybrides PDF (ZUGFeRD)** — `embedZugferdIntoPDF` bettet das XML ins [[PDF Generation|PDF]] ein.

Beides wird aus demselben `mapInvoiceToZugferdData(invoice)` gespeist.

## Empfänger = Krankenkasse
Der **Buyer** der XRechnung ist immer die **Krankenkasse** (`insurance`), nicht der Patient. Der Patient erscheint als `customer`. Fehlt eine strukturierte Kassen-Adresse (Legacy), wird auf die Patientenadresse zurückgefallen. Siehe [[invoices]].

## Wichtige BR-DE-Regeln
| Regel | Bedeutung | Quelle |
|---|---|---|
| **BR-DE-1** | Zahlungsdaten (IBAN/Bank) erforderlich | [[Seller Settings]] / `bankDetails` |
| **BR-DE-2** | Verkäufer-Kontakt (Name/Tel/E-Mail), min. ein Feld | `contact*` |
| **BR-DE-4** | Verkäufer-PLZ erforderlich | Seller-Adresse |
| **BR-DE-9** | Käufer-PLZ (Kasse) erforderlich | Insurance-Adresse |
| **BR-DE-15** | Buyer Reference (BT-10) | Fallback = Rechnungsnummer |
| **BR-CO-26** | min. eine Seller-Kennung (BT-29/30/31) | VAT-ID / Registernummer |

## Validierung
`validateXRechnungInvoice(invoice)` liefert `{ valid, errors, warnings }`:
- **errors** (blockierend): fehlende IBAN (BR-DE-1), fehlende Verkäufer-PLZ (BR-DE-4), fehlende Käufer-PLZ (BR-DE-9).
- **warnings** (informativ): fehlender Verkäufer-Kontakt (BR-DE-2), fehlende E-Mail-Adressen (PEPPOL-EN16931-R010/R020), zweifelhaftes IBAN-Format (BR-DE-19).

Zusätzlich existiert ein strengeres `XRechnungInvoiceSchema` (Zod), das BR-DE-Pflichtfelder direkt erzwingt.

## VAT-Behandlung
Positionen werden nach MwSt-Satz gruppiert; pro Gruppe Basis- und Steuerbetrag (gerundet auf 2 Stellen). `categoryCode`: `S` (Standard), `Z` (0 %). USt-IdNr erhält automatisch das Länderpräfix. Siehe [[Invoice Calculation]].

## Verwandt
- [[PDF Generation]] · [[Invoice Calculation]] · [[Seller Settings]] · [[invoices]]

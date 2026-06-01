---
title: "Tabelle: invoices"
tags: [database, schema]
---

# Tabelle `invoices`

Die zentrale Tabelle. Jede Rechnung enthält einen **Snapshot** der Kundendaten zum Erstellungszeitpunkt, damit spätere Kundenänderungen historische Rechnungen nicht verändern.

## Spalten

### Identität & Status
| Spalte | Typ | Hinweis |
|---|---|---|
| `id` | integer PK | |
| `customerId` | integer **not null** | Verweis auf [[customers]] (kein echter FK) |
| `status` | text, default `"offen"` | Werte: `offen`, `bezahlt`, `storniert` (siehe [[Invoice Lifecycle]]) |
| `date` | text **not null** | Rechnungsdatum (ISO / `YYYY-MM-DD`) |
| `invoiceNumber` | text | Format `YYYY-MM-XXXX`, siehe [[Invoice Numbering]] |
| `createdAt` | text **not null** | ISO-Zeitstempel (auch als Re-Identifikation nach Insert genutzt) |
| `sentAt` | text | Gesetzt, sobald die Rechnung **versendet** wurde (Doku-Zeitpunkt; fürs Budget nicht relevant) |
| `paid` | boolean, default `false` | Bezahlt-Flag |
| `queuedForSending` | boolean, default `false` | In Versand-Queue ([[Webhooks]]) |
| `cancelsInvoiceId` | integer | Auf der **Stornorechnung**: Verweis auf das Original ([[Invoice Cancellation (Storno)]]) |
| `cancelledByInvoiceId` | integer | Auf dem **Original**: Verweis auf seine Stornorechnung |

### Customer-Snapshot
`lastName`, `firstName`, `birthDate`, `careLevel`, `street`, `houseNumber`, `postalCode`, `city`, `insuranceNumber`, `healthInsurance`, `healthInsuranceStreet`, `healthInsuranceHouseNumber`, `healthInsurancePostalCode`, `healthInsuranceCity`, `healthInsuranceCountry`, `healthInsuranceEmail`, `invoiceEmail` (Ziel-E-Mail des Versands).

### Rechnungsdaten
| Spalte | Typ | Hinweis |
|---|---|---|
| `lineItemsJson` | text | **Positionen als JSON** — bevorzugte Datenquelle. Siehe [[Invoice Calculation]] |
| `description` | text **not null** | Legacy-Leistungsbeschreibung |
| `hours` | real **not null** | Legacy: Stundenzahl |
| `ratePerHour` | real, default `47.0` | Legacy: Stundensatz € |
| `km` | real, default `0` | Legacy: Kilometer |
| `ratePerKm` | real, default `0.30` | Legacy: km-Satz € |

> Die Felder `hours`/`km`/`rate*`/`description` sind **Legacy** und dienen als Fallback, wenn keine `lineItemsJson` vorhanden ist.

### Dokumente & Versand
| Spalte | Typ | Hinweis |
|---|---|---|
| `invoicePdfUrl` | text | S3-URL des PDFs ([[PDF Generation]]) |
| `xrechnungXmlUrl` | text | S3-URL des XRechnung-XML ([[XRechnung and ZUGFeRD]]) |
| `abtretungserklaerungUrl` | text | optional beigelegte [[File Uploads|Abtretungserklärung]] |
| `emailSubject` | text | Betreff der Versand-Mail |
| `emailBody` | text | Text der Versand-Mail |

## Empfänger-Logik
Beim Mapping fürs Dokument (`mapDbInvoiceToInvoice`) ist die **Krankenkasse immer der Empfänger (Buyer)**; der Patient ist der `customer`. Hat die Rechnung keine strukturierte Kassen-Adresse, wird auf die Patientenadresse zurückgefallen (Legacy-Daten). Siehe [[XRechnung and ZUGFeRD]].

## Verwandt
- [[Invoice Management]] · [[Invoice Lifecycle]] · [[Invoice Calculation]] · [[Budget Tracking]]

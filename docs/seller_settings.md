---
title: "Tabelle: seller_settings"
tags: [database, schema]
---

# Tabelle `seller_settings`

Firmen-/Absenderdaten des Pflegedienstes. Es existiert **genau eine Zeile** (Single-Row-Konfiguration; `getSellerSettings` liest `limit(1)`).

## Spalten

| Gruppe | Spalten |
|---|---|
| Firma | `name` (not null, default ""), `subHeadline` |
| Adresse | `street`, `streetNumber`, `postalCode`, `city` (alle not null, default ""), `country` (default `"DE"`) |
| Kontakt | `phoneNumber`, `email` |
| Kontaktperson (XRechnung BR-DE-2) | `contactName`, `contactPhone`, `contactEmail` |
| Steuer / Kennzeichen | `taxNumber`, `vatId`, `ikNumber` (Institutionskennzeichen — auf der Rechnung prominent unter dem Firmennamen, siehe [[PDF Generation]]) |
| Recht (Footer) | `court`, `registerNumber`, `managingDirector` |
| Bank | `bankName`, `iban`, `bic` |
| Logo | `logoUrl` (S3) |
| Text | `invoiceGreeting` (Anrede auf der Rechnung) |
| Meta | `updatedAt` (not null) |

## Verwendung
- Verwaltet über `/settings` → `SellerSettingsForm` → `seller.actions.ts` (`getSellerSettings`, `updateSellerSettings`, `uploadLogo`, `deleteLogo`).
- Beim Rechnungsbau lädt `getSellerInfo` / `getBankDetails` / `getLogoUrl` / `getInvoiceGreeting` (in `invoice-helpers.ts`) diese Werte; fehlen sie, greifen **`SELLER_*`-Env-Fallbacks** (siehe [[Environment Variables]]).
- Diese Daten sind Pflicht für XRechnung-Konformität (Bankdaten BR-DE-1, Kontakt BR-DE-2). Siehe [[XRechnung and ZUGFeRD]].

## Verwandt
- [[Seller Settings]] · [[PDF Generation]] · [[Database Overview]]

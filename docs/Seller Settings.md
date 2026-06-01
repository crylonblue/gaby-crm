---
title: Seller Settings
tags: [feature]
---

# Seller Settings

Zentrale Konfiguration der Absender-/Firmendaten unter `/settings`. Tabelle [[seller_settings]] (Single-Row), Actions in `seller.actions.ts`.

## Inhalt
Firmenname & Sub-Headline, **IK-Nummer (Institutionskennzeichen)**, Adresse, Kontakt (Telefon/E-Mail), Kontaktperson (für XRechnung BR-DE-2), Steuernummer & USt-IdNr, Registergericht/-nummer/Geschäftsführer (Footer), Bankdaten (IBAN/BIC/Bank), Logo, Anrede-Text (`invoiceGreeting`).

Die **IK-Nummer** wird auf jeder Rechnung prominent (groß & fett) direkt unter dem Firmennamen ausgegeben — siehe [[PDF Generation]].

## Actions
| Action | Zweck |
|---|---|
| `getSellerSettings()` | Liest die (einzige) Zeile, sonst `null` |
| `updateSellerSettings(data)` | Upsert (insert falls keine Zeile existiert) + `updatedAt` |
| `uploadLogo(formData)` | Logo-Bild → [[S3 Storage|S3]] (`logos/seller/logo.{ext}`), altes Logo wird danach gelöscht |
| `deleteLogo()` | Logo aus S3 + DB entfernen |

## Nutzung beim Rechnungsbau
`invoice-helpers.ts` liest diese Settings über `getSellerInfo`, `getBankDetails`, `getLogoUrl`, `getInvoiceGreeting`. Sind keine Settings gepflegt, greifen **`SELLER_*`-Umgebungsvariablen** als Fallback ([[Environment Variables]]). Diese Daten sind für XRechnung-Konformität nötig ([[XRechnung and ZUGFeRD]]).

## UI
`SellerSettingsForm` (`src/components/settings/`).

## Verwandt
- [[seller_settings]] · [[PDF Generation]] · [[XRechnung and ZUGFeRD]] · [[Environment Variables]]

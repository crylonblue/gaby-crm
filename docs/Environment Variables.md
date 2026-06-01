---
title: Environment Variables
tags: [integration, ops, reference]
---

# Environment Variables

Alle im Code referenzierten Variablen. In der aktuellen `.env` gesetzt sind nur die mit ✅ markierten Gruppen (Turso + S3).

## Datenbank (Pflicht)
| Variable | Zweck |
|---|---|
| `TURSO_DATABASE_URL` ✅ | LibSQL-Verbindungs-URL (Pflicht, sonst Startfehler) |
| `TURSO_AUTH_TOKEN` ✅ | Turso Auth-Token |

## S3 / R2 ([[S3 Storage]])
| Variable | Zweck |
|---|---|
| `S3_BUCKET_NAME` ✅ | Bucket-Name (Pflicht) |
| `S3_ACCESS_KEY` / `AWS_ACCESS_KEY_ID` ✅ | Access Key (Pflicht) |
| `S3_SECRET_KEY` / `AWS_SECRET_ACCESS_KEY` ✅ | Secret Key (Pflicht) |
| `S3_ENDPOINT` ✅ | Custom-Endpoint (z. B. Cloudflare R2) |
| `S3_REGION` / `AWS_REGION` ✅ | Region (Default `auto`→`us-east-1`) |
| `S3_PUBLIC_URL` ✅ | CDN-/Public-Basis-URL für Dateilinks |
| `S3_PATH_PREFIX` | Optionales Präfix für alle Keys |

## Verhalten
| Variable | Zweck |
|---|---|
| `SKIP_S3_UPLOAD` | `true` ⇒ PDF/XRechnung-Erzeugung & Upload überspringen (Test) |
| `NODE_ENV` | u. a. `secure`-Cookie in Production ([[Authentication]]) |

## Legacy Upload
| Variable | Zweck |
|---|---|
| `UPLOAD_WEBHOOK_URL` | Ziel des Legacy-`uploadFile` ([[File Uploads]]); aktuell **nicht** gesetzt |

## Seller-Fallbacks ([[Seller Settings]])
Greifen nur, wenn keine `seller_settings`-Zeile existiert:
`SELLER_NAME`, `SELLER_STREET`, `SELLER_STREET_NUMBER`, `SELLER_POSTAL_CODE`, `SELLER_CITY`, `SELLER_COUNTRY`, `SELLER_PHONE`, `SELLER_EMAIL`, `SELLER_TAX_NUMBER`, `SELLER_VAT_ID`, `SELLER_CONTACT_NAME`, `SELLER_CONTACT_PHONE`, `SELLER_CONTACT_EMAIL`, `SELLER_COURT`, `SELLER_REGISTER_NUMBER`, `SELLER_MANAGING_DIRECTOR`, `SELLER_IBAN`, `SELLER_BANK_NAME`, `SELLER_BIC`, `SELLER_LOGO_URL`.

## Nicht in env (hartkodiert)
- Login-Passwort `"MeinCRM26!"` ([[Authentication]]).
- Versand-Webhook-URL in `sendInvoice` ([[Webhooks]]).

## Verwandt
- [[Development Setup]] · [[Known Issues and Security]]

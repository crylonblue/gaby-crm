---
title: S3 Storage
tags: [integration]
---

# S3 Storage

Alle generierten/hochgeladenen Dateien liegen in einem S3-kompatiblen Bucket. Implementierung: `lib/s3.ts` (AWS SDK v3). Unterstützt **AWS S3** und **Cloudflare R2** (über `S3_ENDPOINT` + `forcePathStyle`).

## Konfiguration (env)
Pflicht: `S3_BUCKET_NAME`, `S3_ACCESS_KEY` (oder `AWS_ACCESS_KEY_ID`), `S3_SECRET_KEY` (oder `AWS_SECRET_ACCESS_KEY`).
Optional: `S3_ENDPOINT` (für R2/custom), `S3_REGION`/`AWS_REGION` (Default `auto`→`us-east-1`), `S3_PUBLIC_URL` (CDN-Basis-URL), `S3_PATH_PREFIX` (Präfix für alle Keys). Siehe [[Environment Variables]].

Fehlen Pflichtwerte, wirft `getS3Config()` eine erklärende Fehlermeldung. R2 erfordert `forcePathStyle: true`.

## Public URL
`buildPublicUrl` nutzt `S3_PUBLIC_URL` (CDN) falls gesetzt; sonst Endpoint-URL (`endpoint/bucket/key`); sonst AWS-Standard (`bucket.s3.region.amazonaws.com/key`).

## Key-Layout
| Inhalt | Key |
|---|---|
| Rechnungs-PDF | `invoices/{userId}/{invoiceId}/invoice-{number}.pdf` |
| XRechnung-XML | `xrechnung/{userId}/{invoiceId}/xrechnung.xml` |
| Firmenlogo | `logos/{companyId}/logo.{png\|jpg}` |
| Abtretungserklärung | `abtretungserklaerungen/{customerId}/{timestamp}-{name}` |

> `userId` ist derzeit fest `"default"`, `companyId` fest `"seller"` (Single-Tenant). Bei gesetztem `S3_PATH_PREFIX` wird allen Keys `{prefix}/` vorangestellt.

## Funktionen
`uploadToS3`, `downloadFromS3`, `uploadXRechnungXmlToS3`, `uploadLogoToS3`, `deleteLogoFromS3`, `uploadAbtretungserklaerungToS3`, plus `extractKeyFromUrl` (URL→Key, CDN-aware).

## Fehlerbehandlung
`AccessDenied` wird mit ausführlicher R2-Troubleshooting-Meldung geloggt; siehe auch `S3_TROUBLESHOOTING.md` im Repo-Root.

## Verwandt
- [[PDF Generation]] · [[XRechnung and ZUGFeRD]] · [[File Uploads]] · [[Environment Variables]]

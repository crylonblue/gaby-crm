---
title: File Uploads
tags: [feature, integration]
---

# File Uploads

Es gibt zwei Upload-Arten, beide letztlich nach [[S3 Storage|S3]].

## 1. Abtretungserklärung (pro Kunde)
- Action `uploadAbtretungserklaerung(formData, customerId)` in `upload.actions.ts`.
- Validierung: nur `application/pdf`, `image/png`, `image/jpeg`/`jpg`; max **10 MB**.
- Upload via `uploadAbtretungserklaerungToS3` → Key `abtretungserklaerungen/{customerId}/{timestamp}-{sanitizedName}`.
- Die zurückgegebene URL wird in [[customers|customers.abtretungserklaerungUrl]] gespeichert.
- Beim [[Invoice Management|Versand]] kann sie optional an die Rechnung gehängt werden (`invoices.abtretungserklaerungUrl`).

## 2. Firmenlogo
- Über [[Seller Settings]] (`uploadLogo`) → Key `logos/seller/logo.{png|jpg}`.

## Legacy: `uploadFile(formData)`
- Existiert weiterhin in `upload.actions.ts`. Leitet die Datei an einen externen Webhook `UPLOAD_WEBHOOK_URL` weiter und erwartet `{ url }` als Antwort.
- ⚠️ `UPLOAD_WEBHOOK_URL` ist in der aktuellen `.env` **nicht gesetzt**; der direkte S3-Weg (`uploadAbtretungserklaerung`) hat diesen Pfad abgelöst. Siehe [[Environment Variables]].

## Verwandt
- [[S3 Storage]] · [[customers]] · [[Seller Settings]]

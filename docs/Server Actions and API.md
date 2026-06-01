---
title: Server Actions and API
tags: [architecture, reference]
---

# Server Actions & API

Vollständige Referenz aller Server Actions (`"use server"`) und HTTP-Endpunkte.

## Server Actions

### `customer.actions.ts` ([[Customer Management]])
- `getCustomers()` → Kunden + `yearlyBudget`
- `getCustomer(id)` → Kunde + `yearlyBudget`
- `createCustomer(data)`
- `updateCustomer(id, data)`
- `deleteCustomer(id)`
- `importCustomers(data[])` → `{ success, count }`

### `invoice.actions.ts` ([[Invoice Management]])
- `createInvoice(data)` → `{ success, error? }`
- `updateInvoice(id, data)` (lehnt `storniert` ab)
- `cancelInvoice(id)` → erzeugt Stornorechnung + sperrt Original ([[Invoice Cancellation (Storno)]])
- `getInvoices()` / `getInvoice(id)`
- `getInvoicesForCustomer(customerId)`
- `getInvoiceCountForCustomer(customerId)`
- `toggleInvoicePaid(id)`
- `sendInvoice({ invoiceId, email, attachAbtretungserklaerung, emailSubject, emailBody })`
- `getMonthlyTurnover()`

### `seller.actions.ts` ([[Seller Settings]])
- `getSellerSettings()` / `updateSellerSettings(data)`
- `uploadLogo(formData)` / `deleteLogo()`

### `template.actions.ts` ([[Invoice Templates]])
- `getTemplates()` / `getTemplate(id)`
- `createTemplate(data)` / `updateTemplate(id, data)` / `deleteTemplate(id)`

### `upload.actions.ts` ([[File Uploads]])
- `uploadAbtretungserklaerung(formData, customerId)` → direkt S3
- `uploadFile(formData)` → Legacy-Webhook

## HTTP-API (`src/app/api/`)

| Methode & Pfad | Zweck | Auth |
|---|---|---|
| `POST /api/auth/login` | Passwort prüfen, Cookie setzen | öffentlich |
| `POST /api/auth/logout` | Cookie löschen | öffentlich |
| `GET /api/invoices` | Rechnungen filtern (`status`,`from`,`to`,`queued`) — für Worker | ⚠️ ungeschützt |
| `POST /api/invoices/webhook` | Status-Callback vom Worker | ⚠️ ungeschützt |

Siehe [[Webhooks]] für die Worker-Integration und [[Authentication]] für die (fehlende) API-Absicherung.

## Verwandt
- [[Architecture Overview]] · [[Webhooks]] · [[Known Issues and Security]]

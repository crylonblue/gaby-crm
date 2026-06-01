---
title: Routing and Pages
tags: [architecture]
---

# Routing and Pages

Next.js **App Router** mit zwei Route-Groups: `(auth)` (öffentlich) und `(dashboard)` (geschützt durch [[Authentication|Middleware]]).

## Seiten

| Route | Datei | Zweck |
|---|---|---|
| `/login` | `app/(auth)/login/page.tsx` | Passwort-Login |
| `/` | `app/(dashboard)/page.tsx` | Dashboard: [[Budget Tracking|Monatsumsatz]] + Schnellzugriffe |
| `/customers` | `app/(dashboard)/customers/page.tsx` | Kundenliste (Suche/Filter) |
| `/customers/new` | `.../customers/new/page.tsx` | Neuer Kunde |
| `/customers/[id]` | `.../customers/[id]/page.tsx` | Kundendetail + erstellte Rechnungen |
| `/customers/[id]/edit` | `.../customers/[id]/edit/page.tsx` | Kunde bearbeiten |
| `/customers/import` | `.../customers/import/page.tsx` | CSV-Import ([[Customer Management]]) |
| `/invoices` | `app/(dashboard)/invoices/page.tsx` | Rechnungsliste |
| `/invoices/new` | `.../invoices/new/page.tsx` | Neue Rechnung |
| `/invoices/[id]/edit` | `.../invoices/[id]/edit/page.tsx` | Rechnung bearbeiten ([[Invoice Management]]) |
| `/settings` | `app/(dashboard)/settings/page.tsx` | [[Seller Settings]] |

`app/(dashboard)/layout.tsx` rendert `AppLayout` (Sidebar + Breadcrumbs). `app/layout.tsx` ist das Root-Layout (Theme, Toaster, TopLoader).

Das Dashboard nutzt `export const dynamic = "force-dynamic"`, damit der Monatsumsatz nicht statisch gecacht wird.

## Komponenten

**Kunden** (`src/components/customers/`): `CustomerForm`, `CustomerRow`, `FilteredCustomerList`, `DeleteCustomerDialog`.

**Rechnungen** (`src/components/invoices/`): `InvoiceForm`, `LineItemsEditor` (Positionen), `TemplateSelector` + `TemplateModal` ([[Invoice Templates]]), `InvoiceListWithSearch`, `MobileInvoiceList`, `SendInvoiceDialog` (Versand-Dialog → `sendInvoice`), `TogglePaidButton`, `CancelInvoiceDialog` (Storno → `cancelInvoice`, [[Invoice Cancellation (Storno)]]).

**Dashboard** (`src/components/dashboard/`): `TurnoverCard`.

**Layout** (`src/components/layout/`): `AppLayout`, `BreadcrumbNav`(+Client).

**Settings** (`src/components/settings/`): `SellerSettingsForm`.

**UI** (`src/components/ui/`): shadcn/ui-Primitive (button, input, dialog, select, table, card, calendar, command, …).

## Verwandt
- [[Architecture Overview]]
- [[Authentication]]

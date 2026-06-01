---
title: "Tabelle: customers"
tags: [database, schema]
---

# Tabelle `customers`

Stammdaten der Patienten/Pflegekunden. Definition in `src/db/schema.ts`.

## Spalten

| Spalte | Typ | Hinweis |
|---|---|---|
| `id` | integer PK, autoincrement | |
| `lastName` | text **not null** | Nachname |
| `firstName` | text **not null** | Vorname |
| `birthDate` | text | Geburtsdatum |
| `mobilePhone` | text | |
| `landlinePhone` | text | |
| `street`, `houseNumber`, `postalCode`, `city` | text | Patientenadresse |
| `insuranceNumber` | text | Versicherungsnummer |
| `healthInsurance` | text | Name der Krankenkasse |
| `healthInsuranceStreet` / `…HouseNumber` / `…PostalCode` / `…City` / `…Country` | text | **Strukturierte Kassen-Adresse** (für [[XRechnung and ZUGFeRD|XRechnung]]) |
| `healthInsurancePhone` | text | |
| `healthInsuranceEmail` | text | E-Mail der Kasse (E-Rechnung-Empfänger) |
| `careLevel` | text | Pflegegrad 1–5 (siehe [[Glossary]]) |
| `email` | text | |
| `notes` | text | Freitext |
| `abtretungserklaerungUrl` | text | S3-URL der [[File Uploads|Abtretungserklärung]] |

## Verwendung
- CRUD & CSV-Import: [[Customer Management]], `customer.actions.ts`.
- Beim Erstellen einer Rechnung werden Kundendaten als **Snapshot** in [[invoices]] kopiert.
- `yearlyBudget` wird in `getCustomers`/`getCustomer` **zur Laufzeit** aus allen erstellten Rechnungen berechnet (nicht aus dieser Tabelle). Siehe [[Budget Tracking]].

## Verwandt
- [[invoices]] · [[customer_budgets]] · [[Database Overview]]

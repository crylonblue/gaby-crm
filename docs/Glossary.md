---
title: Glossary
tags: [overview, reference]
---

# Glossary

Domänenbegriffe (Pflege / deutsches Rechnungswesen), die im Code & in dieser Doku vorkommen.

| Begriff | Bedeutung |
|---|---|
| **Pflegedienst** | Das Unternehmen, das GABY-CRM nutzt (der Rechnungssteller / Seller). |
| **Pflegegrad** (`careLevel`) | Einstufung des Pflegebedarfs (1–5). Im Schema als Text gespeichert. |
| **Krankenkasse** (`healthInsurance`) | Gesetzliche Krankenversicherung. **Empfänger der Rechnung** (Buyer in XRechnung). |
| **Abtretungserklärung** (`abtretungserklaerung`) | Dokument, mit dem der Patient seine Erstattungsansprüche an den Pflegedienst abtritt. Wird als PDF hochgeladen und optional der Rechnung beigelegt. Siehe [[File Uploads]]. |
| **Versicherungsnummer** (`insuranceNumber`) | Kranken­versicherungsnummer des Patienten. |
| **XRechnung** | Deutscher Standard für elektronische B2G-Rechnungen (XML, EN16931-basiert). Siehe [[XRechnung and ZUGFeRD]]. |
| **ZUGFeRD** | Hybrides Rechnungsformat: PDF/A mit eingebettetem XML. |
| **EN16931** | EU-Norm für die semantische Datenstruktur elektronischer Rechnungen. |
| **BR-DE-x** | Deutsche Geschäftsregeln (Business Rules) für XRechnung, z. B. BR-DE-1 (Bankdaten), BR-DE-2 (Verkäufer-Kontakt), BR-DE-15 (Buyer Reference). |
| **Buyer Reference** (`buyerReference`, BT-10) | Leitweg-ID / Referenz des Käufers. Hier: Fallback auf die Rechnungsnummer. |
| **Abgerechnet** | Im UI: Summe **aller erstellten** Rechnungen eines Kunden im Jahr (Stornorechnungen mindern sie über negative Beträge). Siehe [[Budget Tracking]]. |
| **Stornorechnung** | Korrekturrechnung mit negativen Beträgen, die eine Rechnung rückgängig macht. Statt Löschen wird storniert. Siehe [[Invoice Cancellation (Storno)]]. |
| **storniert** | Status einer Rechnung, die per Storno aufgehoben wurde — unveränderlich/gesperrt. |
| **Customer Snapshot** | Kopie der Kundendaten in der Rechnung zum Erstellungszeitpunkt — siehe [[invoices]]. |
| **Line Items** (`lineItemsJson`) | Flexible Rechnungspositionen als JSON. Siehe [[Invoice Calculation]]. |

## Verwandt
- [[Project Overview]]

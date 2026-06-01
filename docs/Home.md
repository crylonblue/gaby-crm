---
title: GABY-CRM Dokumentation
tags: [moc, home]
---

# 🏠 GABY-CRM — Dokumentation

> Obsidian-Vault mit der vollständigen technischen Dokumentation von **GABY-CRM**, einem CRM- & Rechnungssystem für einen deutschen Pflegedienst.

Diese Datei ist die **Map of Content (MOC)** — der Einstiegspunkt in die Doku. Öffne den Ordner `docs/` als Obsidian-Vault, um die `[[Wikilinks]]` und die Graph-Ansicht zu nutzen.

## 🧭 Navigation

### Überblick
- [[Project Overview]] — Was ist GABY-CRM, für wen, welcher Zweck
- [[Tech Stack]] — Frameworks, Libraries, Versionen
- [[Glossary]] — Begriffe (Abtretungserklärung, Pflegegrad, XRechnung …)

### Architektur
- [[Architecture Overview]] — Schichten, Datenfluss, Server Actions
- [[Routing and Pages]] — App-Router-Struktur, alle Seiten
- [[Authentication]] — Login, Cookie-Session, Middleware

### Datenbank
- [[Database Overview]] — Turso/LibSQL + Drizzle
- [[customers]] · [[invoices]] · [[customer_budgets]] · [[seller_settings]] · [[templates]]
- [[Migrations]] — Drizzle-Migrationen & manuelles Migrations-Script

### Features
- [[Customer Management]] — Kundenverwaltung, CSV-Import
- [[Invoice Management]] — Rechnungen erstellen, bearbeiten, versenden
- [[Invoice Lifecycle]] — Statusfluss `offen → bezahlt`, Versand-Queue
- [[Invoice Cancellation (Storno)]] — Stornieren statt Löschen
- [[Budget Tracking]] — Jahresbudget / "Abgerechnet" pro Kunde
- [[Invoice Templates]] — Wiederverwendbare Positionen
- [[Seller Settings]] — Firmen-/Bankdaten für PDF & XRechnung
- [[File Uploads]] — Logo & Abtretungserklärung

### Rechnungserzeugung
- [[Invoice Calculation]] — Netto/Brutto/MwSt-Berechnung
- [[Invoice Numbering]] — Rechnungsnummern `YYYY-MM-XXXX`
- [[PDF Generation]] — PDF via pdf-lib
- [[XRechnung and ZUGFeRD]] — E-Rechnung, BR-DE-Regeln

### Integrationen & Betrieb
- [[S3 Storage]] — AWS S3 / Cloudflare R2
- [[Webhooks]] — Externer Versand-Worker, Callback-API
- [[Environment Variables]] — Alle env-Keys
- [[Server Actions and API]] — Vollständige Funktionsübersicht
- [[Development Setup]] — Lokal starten, Migrationen
- [[Known Issues and Security]] — Bekannte Risiken
- [[Roadmap]] — Geplante Verbesserungen

## ⚠️ Wichtigste Eigenheiten auf einen Blick

- **Empfänger** jeder Rechnung ist immer die **Krankenkasse** (Buyer in XRechnung), nicht der Patient. Siehe [[invoices]].
- **Budget / "Abgerechnet"** wird **abgeleitet** aus **allen erstellten** Rechnungen eines Jahres (kein Versandfilter). Siehe [[Budget Tracking]].
- **Rechnungspositionen** liegen als `lineItemsJson` in der Rechnung; die alten `hours`/`km`-Felder sind Legacy-Fallback. Siehe [[Invoice Calculation]].
- **Versand** läuft über einen **externen Worker** (n8n-Webhook), der via [[Webhooks|Callback-API]] zurückmeldet.
- **Rechnungen werden nie gelöscht**, sondern **storniert**: automatische Stornorechnung + gesperrter `storniert`-Status. Siehe [[Invoice Cancellation (Storno)]].

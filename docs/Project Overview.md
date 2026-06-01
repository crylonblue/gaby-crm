---
title: Project Overview
tags: [overview]
---

# Project Overview

**GABY-CRM** ist ein internes CRM- und Rechnungssystem für einen **deutschen Pflegedienst** (Healthcare / Pflege). Es verwaltet Kunden (Pflegebedürftige) und erzeugt für deren Leistungen Rechnungen, die an die jeweilige **Krankenkasse** gestellt werden.

- **Sprache:** Deutsch (UI & Inhalte)
- **Zielgruppe:** Pflegedienst-Verwaltung (Einzelnutzer / kleines Team)
- **Kern-Use-Case:** Leistungen erfassen → rechtskonforme Rechnung (PDF + [[XRechnung and ZUGFeRD|XRechnung]]) erzeugen → per E-Mail an die Krankenkasse senden → Budget/Umsatz nachhalten.

## Hauptfunktionen

| Bereich | Beschreibung | Note |
|---|---|---|
| Kundenverwaltung | CRUD, CSV-Import, Suche | [[Customer Management]] |
| Rechnungen | Erstellen, bearbeiten, Positionen, Versand | [[Invoice Management]] |
| E-Rechnung | XRechnung/ZUGFeRD (EN16931, BR-DE) | [[XRechnung and ZUGFeRD]] |
| PDF | A4-Rechnungs-PDF mit eingebettetem XML | [[PDF Generation]] |
| Budget | Jahresbudget / "Abgerechnet" pro Kunde | [[Budget Tracking]] |
| Vorlagen | Wiederkehrende Leistungspositionen | [[Invoice Templates]] |
| Einstellungen | Firmen-, Bank-, Steuerdaten, Logo | [[Seller Settings]] |
| Dashboard | Monatsumsatz + Schnellzugriffe | [[Routing and Pages]] |

## Grundidee des Rechnungsflusses

1. Pflegedienst erfasst eine Rechnung für einen Kunden (Positionen).
2. System erzeugt Rechnungsnummer, PDF und XRechnung-XML, lädt beides nach [[S3 Storage|S3]].
3. Beim Versand wird die Rechnung in eine **Queue** gestellt und ein externer [[Webhooks|Worker]] benachrichtigt.
4. Der Worker verschickt die E-Mail an die Krankenkasse und meldet `invoice_sent` zurück → `sentAt` wird gesetzt.
5. Fürs [[Budget Tracking|Budget]] zählt die Rechnung bereits **ab Erstellung** (unabhängig vom Versand).

Siehe [[Invoice Lifecycle]] für den vollständigen Statusfluss.

## Verwandt
- [[Tech Stack]]
- [[Architecture Overview]]
- [[Glossary]]

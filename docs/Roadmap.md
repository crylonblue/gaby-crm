---
title: Roadmap
tags: [ops]
---

# Roadmap

Mögliche Verbesserungen, abgeleitet aus [[Known Issues and Security]] und dem aktuellen Funktionsumfang. Nicht priorisiert / nicht zugesagt.

## Sicherheit & Betrieb
- [ ] Login-Passwort in Env + Hashing; echtes Session-Token (signiert).
- [ ] `/api/*` absichern (API-Key/Signatur für den [[Webhooks|Worker]]).
- [ ] Versand-Webhook-URL in Env-Variable.
- [ ] Rate-Limiting & CSRF.

## Datenmodell
- [ ] Entscheidung zu [[customer_budgets]]: entweder konsequent daraus lesen oder Tabelle entfernen.
- [ ] Migrations-Journal mit `0009`–`0011` in Einklang bringen.
- [ ] Eindeutigkeit der Rechnungsnummer per DB-Constraint/Transaktion.
- [ ] Legacy `hours`/`km`-Felder migrieren/entfernen, sobald alle Rechnungen `lineItemsJson` nutzen.

## Features
- [ ] Stornorechnung als echte Gutschrift/Korrektur in XRechnung kennzeichnen (`typeCode` 384/381 statt 380). Siehe [[Invoice Cancellation (Storno)]].
- [ ] Mehrbenutzer / Rollen (aktuell Single-User).
- [ ] Audit-Log.
- [ ] Datenexport.
- [ ] E-Mail-Benachrichtigungen / Zahlungserinnerungen.

## Verwandt
- [[Known Issues and Security]] · [[Home]]

---
title: Authentication
tags: [architecture, security]
---

# Authentication

Sehr einfache, passwortbasierte Single-User-Authentifizierung. **Kein** Benutzerkonzept, keine Rollen.

## Ablauf

1. `POST /api/auth/login` mit `{ password }` (`src/app/api/auth/login/route.ts`).
2. Vergleich gegen ein **hartkodiertes Passwort**: `"MeinCRM26!"`.
3. Bei Erfolg wird ein Cookie gesetzt:
   - Name `auth_token`, Wert `"true"`
   - `httpOnly`, `sameSite: "strict"`, `secure` nur in Production
   - `maxAge` = 7 Tage, `path: "/"`
4. `POST /api/auth/logout` löscht das Cookie.

## Schutz der Routen

`src/middleware.ts` schützt alles **außer**:
- `/api/*`
- `/_next/*`, `/static/*`
- `/login`
- `/favicon.ico`

Fehlt das `auth_token`-Cookie, wird auf `/login` umgeleitet. Der Matcher schließt `_next/static`, `_next/image` und `favicon.ico` aus.

> ⚠️ **Wichtig:** Die `/api/*`-Routen sind von der Middleware ausgenommen und damit **unauthentifiziert** erreichbar — inkl. der [[Webhooks|Webhook- und Invoice-API]]. Das Cookie prüft nur, *dass* es existiert (`"true"`), nicht *was* es enthält. Siehe [[Known Issues and Security]].

## Verwandt
- [[Known Issues and Security]]
- [[Server Actions and API]]
- [[Routing and Pages]]

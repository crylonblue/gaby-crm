---
title: Development Setup
tags: [ops]
---

# Development Setup

## Voraussetzungen
- Node.js + ein Paketmanager. Es liegen sowohl `package-lock.json` als auch `pnpm-lock.yaml` vor — **pnpm** ist die wahrscheinlich genutzte Variante (konsistent halten).
- Eine erreichbare [[Database Overview|Turso-DB]] und ein [[S3 Storage|S3/R2-Bucket]].

## Schritte
```bash
pnpm install
# .env anlegen (siehe [[Environment Variables]])
pnpm dev          # Next.js Dev-Server (http://localhost:3000)
```

Scripts (`package.json`):
| Script | Befehl |
|---|---|
| `dev` | `next dev` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `eslint` |

## Datenbank / Migrationen
```bash
npx drizzle-kit generate   # Migration erzeugen
npx drizzle-kit push       # Schema pushen
npx tsx scripts/run-migration.ts   # 0011 manuell anwenden (siehe [[Migrations]])
```

## Login
Passwort `MeinCRM26!` (hartkodiert, [[Authentication]]).

## Tests ohne S3
`SKIP_S3_UPLOAD=true` überspringt PDF/XRechnung-Erzeugung & Upload ([[Environment Variables]]).

## Verwandt
- [[Environment Variables]] · [[Migrations]] · [[Tech Stack]]

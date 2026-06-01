---
title: Tech Stack
tags: [overview, reference]
---

# Tech Stack

Quelle: `package.json`. Projektname intern: `sa`, Version `0.1.0`.

## Core
- **Next.js 16.0.10** — App Router, Server Components, Server Actions
- **React 19.2.0** / **React DOM 19.2.0**
- **TypeScript 5**

## Datenbank & ORM
- **Turso (LibSQL)** — SQLite-kompatible Cloud-DB (`@libsql/client`)
- **Drizzle ORM 0.45** + **Drizzle Kit 0.31** — Schema, Migrationen
- **better-sqlite3** — lokale SQLite (`sqlite.db` im Repo, Dev/Tooling)
- Siehe [[Database Overview]]

## UI & Styling
- **Tailwind CSS 4** (`@tailwindcss/postcss`, `tw-animate-css`)
- **shadcn/ui** auf **Radix UI** (Dialog, Popover, Select, Checkbox, Alert-Dialog, Label, Slot)
- **lucide-react** — Icons
- **sonner** — Toasts
- **next-themes** — Dark Mode
- **cmdk** — Command/Combobox
- **react-day-picker** + **date-fns** — Datumsauswahl
- **nextjs-toploader** — Ladebalken

## Formulare & Validierung
- **react-hook-form 7.68** + **@hookform/resolvers**
- **zod 4.1** — Schemas (siehe `lib/schema.ts`, [[XRechnung and ZUGFeRD]])

## Rechnungserzeugung
- **pdf-lib** — PDF-Erzeugung ([[PDF Generation]])
- **node-zugferd** — ZUGFeRD/XRechnung XML (EN16931-Profil, [[XRechnung and ZUGFeRD]])

## Datei & Import
- **@aws-sdk/client-s3** — S3/R2 Upload/Download ([[S3 Storage]])
- **papaparse** — CSV-Import ([[Customer Management]])
- **uuid**

## Utilities
- **class-variance-authority**, **clsx**, **tailwind-merge**

## Dev Tools
- **eslint 9** + **eslint-config-next**
- **drizzle-kit**, **dotenv**

## Verwandt
- [[Project Overview]]
- [[Development Setup]]

# Foodbook & Catering Operations

Eén systeem voor de hele operationele keten:

```
FOODBOOK → EVENT → ORDER → CALCULATION → QUOTATION → PRODUCTION → PURCHASING → PICKING → DELIVERY → INVOICE
```

Elke stap is een echt record dat meedraagt wat de vorige stap heeft uitgerekend. Een wijziging aan
de bron — bijvoorbeeld gram per persoon op een recept — werkt automatisch door in elk
stroomafwaarts document dat nog niet is bevroren. De applicatie is volledig Nederlandstalig.

- Functionele en technische basis: [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- Bouwplan per fase: [docs/PLAN.md](./docs/PLAN.md)
- **Stand van zaken en wat er nu komt: [docs/STATUS.md](./docs/STATUS.md)**
- Gemaakte keuzes en openstaande vragen: [docs/BESLISSINGEN.md](./docs/BESLISSINGEN.md)
- Zelf starten en testen: [docs/INSTALLATIE.md](./docs/INSTALLATIE.md)
- Uitrollen op een server: [docs/DEPLOY.md](./docs/DEPLOY.md)
- Testronde voor de klant (documenten beoordelen): [docs/KLANTTEST.md](./docs/KLANTTEST.md)

## Tech stack

| Laag | Keuze |
|---|---|
| Frontend + beheer | Next.js (React, TypeScript) met embedded Payload CMS |
| Rekenkern en documenten | Pure TypeScript-pakketten, los getest |
| Database | PostgreSQL |
| Media | Lokale schijf (dev) → S3-compatible (productie), varianten via `sharp` |
| Desktop (v1: Windows) | Tauri |
| Taal | Nederlands, via `next-intl`-patroon met eigen berichtencatalogus |

## Repo-indeling

```
foodbook/
  apps/
    web/        # Next.js: Payload-beheer op /admin + Foodbook-presentatie op /
    desktop/    # Tauri-wrapper voor de Windows-desktopapplicatie
  packages/
    calculation-engine/   # schaalregels, allergenen-propagatie, afronding, kostprijs, btw
    documents/            # renderklare documentmodellen voor alle 9 documenttypes
    shared-types/         # entiteiten, enums en datacontracten
    i18n/                 # Nederlandse berichtencatalogus + formattering
  infra/
    docker-compose.yml    # Postgres + S3-compatible opslag voor lokaal ontwikkelen
  docs/
```

De pakketten zijn bewust gescheiden: `calculation-engine` en `documents` zijn het eigen, waardevolle
deel van het systeem. Een fout daarin komt terecht op een inkooplijst of een factuur, dus dat deel
moet los en herhaalbaar te testen zijn.

## Aan de slag

Vereisten: Node.js 20 of hoger.

```bash
npm install
npm run dev                                   # http://localhost:3000 (Foodbook) en /admin (Beheer)
```

Bij de eerste keer opent `/admin` het scherm **"Welkom"** waarin je je eigen gebruiker aanmaakt
(kies de rol **Beheerder**). Daarna vul je in een tweede terminalvenster de wettelijke
referentielijsten:

```bash
npm run seed -w @foodbook/web                 # 14 allergenen + btw-tarieven
```

Er is **geen Docker en geen databaseserver nodig**: zonder `DATABASE_URI` gebruikt de applicatie
een lokaal SQLite-bestand (`apps/web/foodbook.db`). Wil je tegen PostgreSQL draaien — de opzet uit
de architectuur en de database waarin het systeem uiteindelijk bij de klant draait — zet dan
`DATABASE_URI` in `apps/web/.env` en start de database met `npm run db:up`.

Zie [docs/INSTALLATIE.md](./docs/INSTALLATIE.md) voor een stap-voor-stap uitleg, en
[docs/KLANTTEST.md](./docs/KLANTTEST.md) voor het beoordelen van de gegenereerde documenten.

> **Let op — `NODE_ENV=production` op deze machine.** De omgeving heeft `NODE_ENV=production`
> staan, waardoor npm standaard alle devDependencies overslaat en `npm test` of `npm run
> typecheck` niet werkt. Het meegeleverde `.npmrc` zet dat voor dit project uit, en de
> app-scripts zetten hun eigen `NODE_ENV`. Verwijder die bestanden niet.

## Scripts

| Commando | Wat het doet |
|---|---|
| `npm run dev` | Start de webapplicatie (Payload-beheer + Foodbook) |
| `npm test` | Draait alle tests van alle pakketten (151 tests) |
| `npm run typecheck` | Typecontrole over het hele monorepo |
| `npm run build` | Bouwt alle apps en pakketten |
| `npm run db:up` / `db:down` | Start/stopt Postgres en de S3-compatible opslag |
| `npm run seed -w @foodbook/web` | Vult de wettelijke referentielijsten |
| `npm run generate:types -w @foodbook/web` | Genereert Payload-types uit de collecties |
| `npm run dev -w @foodbook/desktop` | Start de desktopapp in ontwikkelmodus |
| `npm run voorbeeld` | Draait het acceptatiescenario (250 gasten) en schrijft alle documenten als HTML én PDF naar `voorbeelddocumenten/` |
| `npm run voorbeeld:beeld` | Maakt schermafbeeldingen van die documenten, om de opmaak te controleren |

### Voorbeelddocumenten bekijken

`npm run voorbeeld` is de snelste manier om het systeem te zien werken zonder database: het draait
één evenement van 250 gasten door de rekenmotor en genereert de offerte, productielijst,
allergenenlijst, inkooplijst, paklijst en factuur — als HTML en als PDF. Het script print daarbij de
uitgerekende hoeveelheden, de inkooplijst met afronding, de offerte en de marge, zodat je de cijfers
direct kunt controleren tegen de verwachting.

De PDF's worden gerenderd met de Edge of Chrome die al op de machine staat (`puppeteer-core`), niet
met een meegebundelde Chromium — zie B11 in [docs/BESLISSINGEN.md](./docs/BESLISSINGEN.md).

## Stand van zaken

De **rekenkern** en de **documentenmotor** zijn af en volledig getest, en de **applicatie draait**:
inloggen, catalogus beheren en de referentielijsten laden werkt. Wat nog ontbreekt is de bediening
in de beheeromgeving — er is nog geen knop die een evenement doorrekent en de documenten maakt.

Zie **[docs/STATUS.md](./docs/STATUS.md)** voor het volledige overzicht per fase, wat er bewezen
werkt, wat er nog niet is en wat de eerstvolgende stappen zijn.

### Kwaliteitscontrole

| Controle | Uitkomst |
|---|---|
| `npm test` | 151 tests, allemaal groen (89 rekenmotor, 46 documenten, 16 i18n) |
| `npm run typecheck` | Schoon over alle vijf de packages én de scripts |
| `npm run build` | Productiebuild slaagt; `/`, `/admin`, `/api` en `/api/graphql` worden gegenereerd |
| `npm run lint` | Geen fouten en geen waarschuwingen |
| `npm run dev` | Applicatie start; `/admin` en het eerste-gebruikerscherm geven 200 |
| `npm run voorbeeld` | Genereert 6 documenten als HTML én PDF voor een evenement van 250 gasten |

De uitrolbestanden (Dockerfile, productie-compose, Caddyfile) zijn geschreven maar **nog niet
gebouwd of getest**, omdat er op deze machine geen Docker staat. Reken op één correctieronde bij de
eerste uitrol; zie [docs/DEPLOY.md](./docs/DEPLOY.md).

## Ontwikkelafspraken

- Geen hardgecodeerde Nederlandse teksten in schermen of documenten: alles loopt via
  `packages/i18n`.
- De rekenmotor leest nooit zelf uit de database. Elke functie is puur en krijgt zijn data
  meegegeven, zodat elke rekenregel los te testen is.
- Een bevroren document (offerte, factuur) wordt nooit herberekend. Wat verzonden is, blijft staan.

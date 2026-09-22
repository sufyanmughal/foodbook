# Fase 1 — Fundament

Uren: **25**
Afhankelijk van: —
Volgende fase: [Fase 2 — Datamodel & Beheer](./02-datamodel-beheer.md)
Terug naar: [PLAN.md](../PLAN.md) · [ARCHITECTURE.md](../ARCHITECTURE.md)

## Doel

De technische basis neerzetten waar alle volgende fasen op bouwen: repo-structuur, database, authenticatie, en de Nederlandse taallaag vanaf dag 1.

## Acties

1. Monorepo opzetten volgens [ARCHITECTURE.md §6](../ARCHITECTURE.md#6-application-structure-repo-layout): `apps/web`, `apps/admin`, `apps/desktop`, `packages/*`, `infra/`.
2. PostgreSQL lokaal opzetten via `docker-compose.yml` in `infra/`.
3. Payload CMS installeren en verbinden met PostgreSQL.
4. Next.js-project opzetten in `apps/web`, verbonden aan Payload's API.
5. Authenticatie inrichten: login, sessie/JWT-afhandeling, wachtwoord-reset.
6. Rollen aanmaken (§3.17): Beheerder, Verkoop, Keuken, Logistiek — met basis-toegangsregels (nog leeg qua collecties, structuur alvast klaar).
7. `next-intl` inrichten met `nl` als standaardlocale; berichtencatalogus-structuur opzetten in `packages/i18n`.
8. Basis design-systeem/UI-componenten opzetten (kleuren, typografie, knoppen, formuliervelden) — herbruikbaar in zowel Beheer als Foodbook-weergave.
9. Bedrijfsinstellingen-collection vastleggen (naam, logo-plek, KVK/btw-nummer) — wordt in Fase 8 gebruikt door documenten, maar structuur hoort hier thuis.
10. CI/basis-scripts: `dev`, `build`, `lint`, `test` werkend voor het hele monorepo.

## Klaar is klaar

- [ ] Project start lokaal op met één commando, database verbonden
- [ ] Inloggen werkt met minstens 2 rollen aangemaakt
- [ ] Alle schermen tonen (nog lege) Nederlandse teksten via de i18n-laag, geen hardgecodeerde strings
- [ ] Repo-structuur volgt ARCHITECTURE.md §6 exact

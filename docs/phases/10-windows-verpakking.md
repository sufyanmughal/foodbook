# Fase 10 — Windows-verpakking

Uren: **12**
Afhankelijk van: [Fase 9 — Documentenmotor](./09-documentenmotor.md), [Fase 7 — Offline & Synchronisatie](./07-offline-sync.md)
Volgende fase: [Fase 11 — Testen & Oplevering](./11-testen-oplevering.md)
Terug naar: [PLAN.md](../PLAN.md) · [ARCHITECTURE.md](../ARCHITECTURE.md)

## Doel

De webapplicatie (inclusief lokale SQLite-laag en synchronisatie) verpakken als een volwaardige Windows-desktopapplicatie — zie [ARCHITECTURE.md §8](../ARCHITECTURE.md#8-platform-roadmap).

## Acties

1. Tauri toevoegen aan `apps/desktop`, gekoppeld aan de build-output van `apps/web`.
2. Applicatie-icoon, naam, versie-informatie instellen.
3. Lokale/productie-API-verbinding configureren (desktop-app praat met de backend, lokaal of gehost).
4. Installatiebestand (`.msi` of `.exe`) genereren en testen op een schone Windows-installatie.
5. Basis auto-update-mechanisme overwegen/instellen indien binnen tijd haalbaar (anders: handmatige herinstallatie-procedure documenteren voor v1).
6. Functioneren offline/bij verbroken verbinding controleren en nette foutmelding tonen (geen crash).

## Klaar is klaar

- [ ] Werkend Windows-installatiebestand geproduceerd
- [ ] Applicatie start, logt in, en werkt functioneel identiek aan de webversie
- [ ] Geteste installatie op een schone Windows-machine zonder ontwikkelomgeving

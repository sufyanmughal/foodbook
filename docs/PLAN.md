# Foodbook & Catering Operations — Bouwplan (Index)

Dit is het gelinkte bouwplan, opgedeeld per fase. Elke fase heeft zijn eigen bestand met concrete acties, afhankelijkheden en een aftekenlijst ("definition of done"). Totaal: **~408 uur**, verdeeld zoals hieronder.

> **Versie-opmerking:** dit plan is bijgewerkt na klantfeedback (offline-werking, aparte Materialenlijst, acceptatietest). De oorspronkelijke 330-uursschatting ging uit van een altijd-verbonden desktop-client. Fase 7 (Offline & Synchronisatie) is nieuw toegevoegd — zie [ARCHITECTURE.md §7](./ARCHITECTURE.md#7-offline-operation-local-data--sync) voor de volledige onderbouwing waarom dit geen "gratis extra" is maar een structurele architectuurwijziging.

Architectuurbasis: zie [ARCHITECTURE.md](./ARCHITECTURE.md) — dit plan volgt dezelfde entiteiten, tech-stack en scope-grenzen 1-op-1.

## Fasevolgorde & afhankelijkheden

```
Fase 1: Fundament
   ↓
Fase 2: Datamodel & Beheer  ─────────────┐
   ↓                                      │
Fase 3: Rekenmotor                        │
   ↓                                      │
Fase 4: Media/Foto-beheer  ←──────────────┘ (kan parallel aan Fase 3)
   ↓
Fase 5: Klanten, Evenementen, Offertes
   ↓
Fase 6: Order → Productie → Inkoop → Picking/Levering
   ↓
Fase 7: Offline & Synchronisatie  (kan parallel starten zodra Fase 3 stabiel is)
   ↓
Fase 8: Facturatie
   ↓
Fase 9: Documentenmotor  (leest van Fase 5, 6, 8 — kan starten zodra Fase 5 stabiel is)
   ↓
Fase 10: Windows-verpakking
   ↓
Fase 11: Testen & Oplevering  (incl. acceptatietest, zie ARCHITECTURE.md §10)
```

## Overzichtstabel

| # | Fase | Bestand | Uren | Afhankelijk van |
|---|---|---|---|---|
| 1 | Fundament | [phases/01-fundament.md](./phases/01-fundament.md) | 25 | — |
| 2 | Datamodel & Beheer | [phases/02-datamodel-beheer.md](./phases/02-datamodel-beheer.md) | 43 | Fase 1 |
| 3 | Rekenmotor | [phases/03-rekenmotor.md](./phases/03-rekenmotor.md) | 60 | Fase 2 |
| 4 | Media/Foto-beheer | [phases/04-media-foto-beheer.md](./phases/04-media-foto-beheer.md) | 35 | Fase 2 |
| 5 | Klanten, Evenementen, Offertes | [phases/05-klanten-evenementen-offertes.md](./phases/05-klanten-evenementen-offertes.md) | 40 | Fase 3 |
| 6 | Order → Productie → Inkoop → Picking/Levering (incl. aparte Materialenlijst) | [phases/06-order-tot-levering.md](./phases/06-order-tot-levering.md) | 53 | Fase 5 |
| 7 | **Offline & Synchronisatie (nieuw)** | [phases/07-offline-sync.md](./phases/07-offline-sync.md) | 70 | Fase 3, 6 |
| 8 | Facturatie | [phases/08-facturatie.md](./phases/08-facturatie.md) | 20 | Fase 6 |
| 9 | Documentenmotor | [phases/09-documentenmotor.md](./phases/09-documentenmotor.md) | 45 | Fase 5, 6, 8 |
| 10 | Windows-verpakking | [phases/10-windows-verpakking.md](./phases/10-windows-verpakking.md) | 12 | Fase 9 |
| 11 | Testen & Oplevering (incl. acceptatietest) | [phases/11-testen-oplevering.md](./phases/11-testen-oplevering.md) | 25 | Fase 7, 10 |
| — | Coördinatie (doorlopend, niet één fase) | [phases/00-coordinatie.md](./phases/00-coordinatie.md) | 15 | doorlopend |

**Totaal: 408 uur** (was 330 uur — de toename komt volledig uit de nieuwe offline/sync-architectuur (+70u), de aparte/gekoppelde Materialenlijst (+8u), en een uitgebreidere acceptatietest/oplevering (+5u, +2u coördinatie). Zie klantbericht voor de volledige toelichting waarom.

## Hoe dit plan te gebruiken

- Elk fase-bestand bevat: doel, concrete genummerde acties, welke entiteiten/bestanden uit de architectuur erbij horen, en een "klaar is klaar"-checklist.
- Vink acties af naarmate ze klaar zijn — dit bestand en de fase-bestanden zijn de werkende voortgangsregistratie voor de bouw.
- Scope-grenzen (wat wel/niet in v1 zit) staan in [ARCHITECTURE.md §9](./ARCHITECTURE.md#9-what-is-explicitly-not-in-v1) — bij twijfel tijdens het bouwen, dat is de scheidsrechter.
- De formele acceptatietest (250-gasten scenario) staat in [ARCHITECTURE.md §10](./ARCHITECTURE.md#10-v1-acceptance-test-definition-of-done) en wordt uitgevoerd in [Fase 11](./phases/11-testen-oplevering.md).

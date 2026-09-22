# Fase 4 — Media / Foto-beheer

Uren: **35**
Afhankelijk van: [Fase 2 — Datamodel & Beheer](./02-datamodel-beheer.md) (kan parallel aan Fase 3 lopen)
Volgende fase: [Fase 5 — Klanten, Evenementen, Offertes](./05-klanten-evenementen-offertes.md)
Terug naar: [PLAN.md](../PLAN.md) · [ARCHITECTURE.md](../ARCHITECTURE.md)

## Doel

Volledig zelfstandig fotobeheer voor beheerders, zonder ontwikkelaar — expliciet gevraagd door de klant. Zie [ARCHITECTURE.md §3.9](../ARCHITECTURE.md#39-media-media--photo-management).

## Acties

1. **Media** collection aanmaken in Payload met varianten-generatie (thumbnail / foodbook-card / foodbook-hero / print).
2. Object storage aansluiten (lokaal voor dev, S3-compatible voor productie).
3. `sharp`-pipeline bouwen: bij upload automatisch bijsnijden/verkleinen naar de vaste Foodbook-verhoudingen, ongeacht bronformaat.
4. Upload-component bouwen: meerdere foto's tegelijk kunnen uploaden aan één product.
5. Vervang-functie: bestaande foto vervangen met behoud van positie/volgorde.
6. Verwijder-functie met bevestigingsstap.
7. Hoofdfoto/cover-foto selecteren (moet altijd onderdeel zijn van de gekoppelde foto's-lijst).
8. Drag-and-drop herordenen van foto's binnen een product.
9. Bijsnij-tool (crop) in de upload-flow met vast aspect ratio passend bij Foodbook-kaart/hero-formaat.
10. Alt-tekst-veld per foto (toegankelijkheid, en herbruikbaar als het Foodbook ooit als webpagina gepubliceerd wordt).
11. Koppelen aan Product-scherm uit Fase 2 zodat het hele foto-beheer direct vanuit het productbewerkingsscherm werkt.

## Klaar is klaar

- [ ] Een Beheerder kan zonder ontwikkelaar: uploaden, vervangen, verwijderen, meerdere foto's toevoegen, hoofdfoto kiezen, herordenen — alles vanuit het productscherm
- [ ] Geüploade foto's worden automatisch correct bijgesneden/verkleind voor Foodbook-weergave, ongeacht brongrootte
- [ ] Elk product toont zijn hoofdfoto correct in lijstweergaves en zijn volledige fotoset in detailweergave

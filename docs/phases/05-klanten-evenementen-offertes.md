# Fase 5 — Klanten, Evenementen, Offertes

Uren: **40**
Afhankelijk van: [Fase 3 — Rekenmotor](./03-rekenmotor.md)
Volgende fase: [Fase 6 — Order → Productie → Inkoop → Picking/Levering](./06-order-tot-levering.md)
Terug naar: [PLAN.md](../PLAN.md) · [ARCHITECTURE.md](../ARCHITECTURE.md)

## Doel

Het startpunt van de operationele keten bouwbaar maken: klant → evenement → offerte, met de rekenmotor uit Fase 3 er direct achter.

## Acties

1. **Customer/Klant**-beheerscherm afwerken (uitbreiding op Fase 2-collection): zoeken, filteren, klanthistorie tonen.
2. **Event/Evenement** collection en scherm bouwen (§3.7): klant koppelen, datum, locatie, aantal gasten, status-workflow.
3. **EventLine**-editor bouwen: producten aan een evenement toevoegen, met optionele per-regel overrides voor gasten en hoeveelheid-per-persoon — dit scherm praat direct met de rekenmotor uit Fase 3.
4. Live-herberekening zichtbaar maken in de UI: verander gastenaantal, zie regels direct updaten (gebruikmakend van het testscherm uit Fase 3, nu productie-waardig gemaakt).
5. **EventMaterialLine**: materialen aan een evenement koppelen (uit de Materials-collection, zie Fase 6).
6. **Quotation/Offerte** collection en generatielogica (§3.10): snapshot van EventLine-data + berekende prijzen bevriezen op het moment van genereren.
7. Versiebeheer voor offertes: elke wijziging na verzending maakt een nieuwe versie, oude versies blijven bewaard.
8. Offerte-statusworkflow: Concept → Verzonden → Geaccepteerd → Verlopen → Geweigerd.
9. Subtotaal/btw/totaal-berekening op offerteniveau (per btw-tarief gesplitst, niet alleen totaal).
10. Koppeling naar Fase 8 (documentenmotor) voorbereiden: offerte-data in de vorm die het PDF-sjabloon straks nodig heeft.

## Klaar is klaar

- [ ] Een evenement kan volledig opgebouwd worden: klant, datum, gasten, producten, materialen
- [ ] Wijzigen van gastenaantal op een evenement herberekent alle regels live in de UI
- [ ] Een offerte kan gegenereerd worden als bevroren snapshot met correcte subtotaal/btw/totaal
- [ ] Een latere prijswijziging op een product verandert een reeds verzonden offerte niet met terugwerkende kracht

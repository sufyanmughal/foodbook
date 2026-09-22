# Fase 3 — Rekenmotor (calculation engine)

Uren: **60** — de belangrijkste fase van het hele systeem
Afhankelijk van: [Fase 2 — Datamodel & Beheer](./02-datamodel-beheer.md)
Volgende fase: [Fase 5 — Klanten, Evenementen, Offertes](./05-klanten-evenementen-offertes.md)
Terug naar: [PLAN.md](../PLAN.md) · [ARCHITECTURE.md](../ARCHITECTURE.md)

## Doel

De kernlogica bouwen die automatisch alles herberekent zodra het aantal gasten of een hoeveelheid-per-persoon wijzigt — precies het probleem dat de klant expliciet noemde (180g → 160g, automatische herberekening). Zie volledige rekenregels in [ARCHITECTURE.md §4](../ARCHITECTURE.md#4-the-calculation-engine-core-differentiator).

## Acties

1. `packages/calculation-engine` opzetten als losstaand, onafhankelijk testbaar TypeScript-pakket (geen UI-afhankelijkheden).
2. Kernfunctie implementeren: `benodigde_hoeveelheid(ingredient, event)` volgens de formule in ARCHITECTURE.md §4.1.
3. `EventLine`-overrides implementeren: `hoeveelheid_per_persoon_override` en `aantal_gasten_override` per regel, met fallback naar productstandaard.
4. Trigger-logica: wijziging van `Event.aantal_gasten` herberekent live alle regels van dat evenement (§4.2).
5. Trigger-logica: wijziging van `Product.hoeveelheid_per_persoon` herberekent alleen open/toekomstige evenementen — **niet** al verzonden offertes/facturen (bevroren snapshots, zie §3.10/§3.16). Dit onderscheid expliciet en zichtbaar maken in de UI.
6. Allergenen-propagatie implementeren als pure functie: `Ingredient.allergenen` → unie omhoog naar `Recipe` → unie omhoog naar `Product` (§4.3).
7. Afrondingsregels implementeren: exacte hoeveelheid voor productie/keukenlijsten, naar boven afgerond op praktische inkoopeenheid voor inkooplijsten (§4.4).
8. Kostprijs- en margeberekening: kostprijs per portie (uit `Ingredient.inkoopprijs`) los van verkoopprijs (`Product.prijs_per_persoon`) — nooit automatisch gelijkgesteld.
9. Unit-tests schrijven voor elke rekenregel (dit pakket is het meest kritieke onderdeel van het systeem — fouten hier raken elk downstream document en elke factuur).
10. Eenvoudig testscherm/route bouwen (kan tijdelijk, hergebruikt in Fase 5) om een evenement + gastenaantal in te voeren en de herberekende regels live te zien.

## Klaar is klaar

- [ ] Wijzigen van gastenaantal herberekent alle productregels direct en correct
- [ ] Wijzigen van gram/ml/stuks-per-persoon op productniveau herberekent alleen open evenementen, nooit bevroren offertes/facturen
- [ ] Allergenenlijst van een product is altijd correct afgeleid, ook na wijziging van een ingrediënt
- [ ] Inkoophoeveelheden ronden praktisch af; productie/keukenhoeveelheden blijven exact
- [ ] Alle rekenregels hebben geautomatiseerde tests die slagen

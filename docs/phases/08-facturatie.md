# Fase 8 — Facturatie

Uren: **20**
Afhankelijk van: [Fase 6 — Order → Productie → Inkoop → Picking/Levering](./06-order-tot-levering.md)
Volgende fase: [Fase 9 — Documentenmotor](./09-documentenmotor.md)
Terug naar: [PLAN.md](../PLAN.md) · [ARCHITECTURE.md](../ARCHITECTURE.md)

## Doel

Wettelijk correcte facturatie vanuit een afgeronde Order, met sequentiële nummering en btw-uitsplitsing per tarief — zie [ARCHITECTURE.md §3.16](../ARCHITECTURE.md#316-invoice-facturen).

## Acties

1. **Invoice/Factuur** collection en scherm: gekoppeld aan Order, snapshot van regels op factuurmoment (bevroren, net als offertes).
2. Sequentieel factuurnummer-systeem: gapless, wettelijk formaat, geen handmatige invoer nodig.
3. Btw-uitsplitsing per tarief (niet alleen een totaalbedrag) — verplicht voor Nederlandse facturen met gemengde tarieven (9%/21%).
4. Factuurstatus-workflow: Concept → Verzonden → Betaald → Te laat.
5. Vervaldatum-logica en eenvoudige signalering van openstaande/te late facturen op een overzichtsscherm.
6. Koppeling naar Fase 9: factuurdata in de vorm die het PDF-factuursjabloon nodig heeft.
7. Crediteren/corrigeren: eenvoudig mechanisme om een factuur te annuleren/crediteren zonder het sequentiële nummer te breken (wettelijk vereist — nummers mogen niet herbruikt of verwijderd worden).

## Klaar is klaar

- [ ] Facturen krijgen automatisch een sequentieel, gapless nummer
- [ ] Btw wordt correct per tarief uitgesplitst op de factuur
- [ ] Een factuur bevriest de regelgegevens op het moment van aanmaken
- [ ] Factuurstatus is zichtbaar en overzicht van openstaande/te late facturen werkt

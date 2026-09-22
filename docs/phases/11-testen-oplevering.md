# Fase 11 — Testen & Oplevering

Uren: **25**
Afhankelijk van: [Fase 10 — Windows-verpakking](./10-windows-verpakking.md)
Vorige fase: alle fasen 1–10 moeten functioneel compleet zijn
Terug naar: [PLAN.md](../PLAN.md) · [ARCHITECTURE.md](../ARCHITECTURE.md)

## Doel

Het volledige systeem end-to-end valideren tegen de v1-scope zoals afgesproken met de klant, inclusief de formele acceptatietest, fouten oplossen, en overdragen.

## Acties

1. **Acceptatietest uitvoeren** volgens [ARCHITECTURE.md §10](../ARCHITECTURE.md#10-v1-acceptance-test-definition-of-done): compleet testevenement voor 250 gasten, volledige keten Evenement → Berekening → Offerte → Voedsel-bestellijst → Materialenlijst → Allergenenlijst → PDF → Print → E-mail, inclusief herberekening bij gastenaantal-wijziging.
2. Offline-scenario expliciet testen: dezelfde acceptatietest volledig zonder internetverbinding herhalen (stap 8 van de acceptatietest), inclusief e-mail-wachtrij die na herverbinding alsnog verstuurt.
3. Testen van de rekenmotor-scenario's expliciet genoemd door de klant: gastenaantal wijzigen, gram-per-persoon wijzigen (180g → 160g), controleren dat alles downstream correct herberekent.
4. Testen van fotobeheer-flow: uploaden, vervangen, verwijderen, herordenen, hoofdfoto wijzigen — door een niet-ontwikkelaar getest.
5. Testen van alle documenttypes inclusief de aparte Materialenlijst en Allergenenlijst: genereren, printen, PDF, e-mailen — inhoud steekproefsgewijs handmatig gecontroleerd op juistheid.
6. Rollentest: elke rol (Beheerder/Verkoop/Keuken/Logistiek) test zijn eigen schermen en rechten.
7. Bugfixronde op basis van bovenstaande testen.
8. Feedbackronde met klant: klant test zelf (of samen) op het 250-gasten testevenement, aanpassingen verwerken.
9. Korte overdracht/trainingssessie voor het team van de klant (zoals afgesproken in de v1-scope).
10. Documentatie-overdracht: dit bouwplan, ARCHITECTURE.md, en een korte gebruikershandleiding (Nederlands) voor de belangrijkste dagelijkse handelingen (product toevoegen, foto wijzigen, evenement aanmaken, document genereren).
11. Definitieve oplevering en scope-aftekening tegen [ARCHITECTURE.md §9](../ARCHITECTURE.md#9-what-is-explicitly-not-in-v1).

## Klaar is klaar

- [ ] Acceptatietest (250 gasten, volledige keten, online én offline) slaagt volledig zonder handmatige workarounds
- [ ] Klant heeft trainingssessie gehad en kan zelfstandig product/foto/evenement beheren
- [ ] Alle punten uit de v1-scope-checklist (ARCHITECTURE.md §9 en de oorspronkelijke klantafspraak) zijn afgevinkt
- [ ] Systeem staat live/geïnstalleerd bij de klant, klaar voor gebruik

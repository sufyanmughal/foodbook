# Fase 6 — Order → Productie → Inkoop → Picking/Levering

Uren: **53**
Afhankelijk van: [Fase 5 — Klanten, Evenementen, Offertes](./05-klanten-evenementen-offertes.md)
Volgende fasen: [Fase 7 — Offline & Synchronisatie](./07-offline-sync.md), [Fase 8 — Facturatie](./08-facturatie.md)
Terug naar: [PLAN.md](../PLAN.md) · [ARCHITECTURE.md](../ARCHITECTURE.md)

## Doel

De volledige operationele middenkant van de keten: een geaccepteerde offerte wordt een order, en rolt automatisch door naar productie, inkoop, een **aparte Materialenlijst**, en een gecombineerde picking/leverlijst (v1-scope: picking en levering als proces gecombineerd, maar Materialenlijst en Voedsel/Inkooplijst zijn en blijven twee gescheiden lijsten — expliciet bevestigd door de klant; zie [ARCHITECTURE.md §9](../ARCHITECTURE.md#9-what-is-explicitly-not-in-v1)).

## Acties

1. **Order** collection en scherm (§3.11): offerte accepteren → order aanmaken, statusworkflow Bevestigd → In productie → Gereed → Geleverd.
2. **Material/Materiaal** collection afwerken (§3.8): niet-voedsel operationele items (serviesgoed, bestek, serveermaterialen, gastronormbakken, verwarmingsapparatuur), categorieën, eenheid, optionele `schaalbaar_per_persoon` + `hoeveelheid_per_persoon`, eenvoudige voorraadvlag, huur/kostprijs.
3. **Product ↔ Material koppeling**: many-to-many relatie `Product.benodigde_materialen`, zodat een menu/buffet automatisch de bijbehorende materialen meebrengt bij toevoeging aan een evenement.
4. **EventMaterialLine**: materialen direct aan een evenement toevoegen (handmatig, bovenop wat automatisch via producten binnenkomt), met dezelfde override-mogelijkheid als EventLine.
5. **Production/Productie** — afgeleide logica (§3.12): explodeer elk orderproduct via zijn recept naar geschaalde ingrediëntregels, met de rekenmotor uit Fase 3.
6. Keukenlijst-notities: vrij tekstveld bovenop de gegenereerde productieregels voor interne instructies.
7. **Purchasing/Inkoop** — aggregatielogica (§3.13): tel ingrediëntbehoefte op over **alle** producties binnen een gekozen periode, gegroepeerd per leverancier — dit blijft uitsluitend voedsel/ingrediënten, materialen lopen nooit via deze lijst.
8. **Materialenlijst-aggregatie** (nieuw, apart van Inkoop): bereken per evenement de benodigde materialen — som van direct toegevoegde EventMaterialLines + automatisch gekoppelde materialen via geselecteerde producten, geschaald op gastenaantal waar `schaalbaar_per_persoon` van toepassing is.
9. Voorraad-aftrek (eenvoudig): als `voorraad_beheerd` aan staat, trek huidige voorraad af van de berekende inkoop- of materiaalbehoefte.
10. **Picking** collection en scherm (§3.14): gecombineerde lijst van voedselitems (uit Productie) + materialen (uit de Materialenlijst-aggregatie), met afvink-functionaliteit (`afgevinkt_door`, `afgevinkt_op`).
11. **Delivery/Levering** collection en scherm (§3.15): leverdatum/tijd, adres (overgenomen van Event, aanpasbaar), verantwoordelijke, statusworkflow Gepland → Onderweg → Geleverd.
12. Statusdoorkoppeling: wanneer een Order naar "Geleverd" gaat, worden gekoppelde Picking/Delivery-records automatisch afgesloten.
13. Overzichtsschermen per rol: Keuken ziet productie/keukenlijsten, Logistiek ziet picking/levering, Inkoop ziet de inkooplijst, Materialenbeheer ziet de materialenlijst.

## Klaar is klaar

- [ ] Een geaccepteerde offerte wordt met één actie een Order
- [ ] Productielijst wordt automatisch en correct geschaald gegenereerd uit de Order, via de rekenmotor
- [ ] Inkooplijst (voedsel) en Materialenlijst (niet-voedsel) zijn twee aantoonbaar gescheiden, correct berekende lijsten
- [ ] Materialen die aan een product/menu gekoppeld zijn, verschijnen automatisch in de Materialenlijst zodra dat product aan een evenement wordt toegevoegd
- [ ] Inkooplijst aggregeert correct over meerdere evenementen in een gekozen periode
- [ ] Picking/leverlijst combineert voedsel + materialen in één werkbare lijst met afvinkfunctie
- [ ] Status van Order/Productie/Picking/Levering is consistent en logisch gekoppeld

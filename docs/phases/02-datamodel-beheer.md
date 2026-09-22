# Fase 2 — Datamodel & Beheer

Uren: **43**
Afhankelijk van: [Fase 1 — Fundament](./01-fundament.md)
Volgende fasen: [Fase 3 — Rekenmotor](./03-rekenmotor.md), [Fase 4 — Media/Foto-beheer](./04-media-foto-beheer.md) (beide parallel mogelijk)
Terug naar: [PLAN.md](../PLAN.md) · [ARCHITECTURE.md](../ARCHITECTURE.md)

## Doel

Alle basis-entiteiten als Payload-collecties bouwen, zodat beheerders producten, recepten, ingrediënten, allergenen en btw-tarieven zelf kunnen beheren zonder ontwikkelaar. Zie volledige velddefinities in [ARCHITECTURE.md §3.1–§3.5](../ARCHITECTURE.md#3-data-model--entities-in-detail).

## Acties

1. **Allergen/Allergenen** collection: de 14 wettelijke EU-allergenen vooraf invullen (§3.4).
2. **VATRate/BTW-tarieven** collection: 9%/21% vooraf invullen, standaardtarief instelbaar (§3.5).
3. **Ingredient/Ingrediënten** collection: naam, inkoopeenheid, inkoopprijs, leverancier-relatie, allergenen-relatie (§3.3).
4. **Supplier/Leverancier** eenvoudige collection (naam, contact) ter ondersteuning van Ingredient en later Inkoop.
5. **Recipe/Recepten** collection met herhaalbare **RecipeLine**-subvelden (ingrediënt + hoeveelheid + eenheid) (§3.2).
6. **Category/Categorie** collection voor productindeling (Voorgerecht/Hoofdgerecht/etc.).
7. **Product/Producten** collection: alle velden uit §3.1, inclusief koppeling naar Recipe, Category, VATRate, Allergen (directe tags), en een placeholder-relatie naar Media (volledig werkend na Fase 4).
8. Product duplicatie-functie: een bestaand product/gerecht kopiëren als startpunt voor een nieuwe variant, inclusief recept/ingrediënten/allergenen, exclusief foto's (nieuwe foto's toevoegen na dupliceren).
9. Product tijdelijk deactiveren (`actief`-vlag) zonder verwijderen, zodat een gerecht uit het Foodbook verdwijnt maar de data behouden blijft.
10. Rolgebaseerde toegangsregels per collection instellen (wie mag wat bewerken, volgens §3.17).
11. Zoek/filter-functionaliteit in de Payload-adminlijsten voor Producten en Ingrediënten (op naam, categorie, actief/inactief).
12. Validatie: verplichte velden, positieve getallen voor hoeveelheden/prijzen, geen duplicate allergenen-codes.

## Klaar is klaar

- [ ] Een Beheerder kan een nieuw product aanmaken met recept, ingrediënten, categorie, btw-tarief en allergenen — zonder ontwikkelaar
- [ ] Een Beheerder kan een bestaand product dupliceren, bewerken, tijdelijk deactiveren en verwijderen — zonder ontwikkelaar
- [ ] Allergenen van een product worden correct getoond op basis van gekoppeld recept (voorbereiding op automatische propagatie in Fase 3)
- [ ] Alle collecties hebben correcte rolgebaseerde rechten
- [ ] Testdata (minstens 10 producten, 5 recepten, 20 ingrediënten) succesvol ingevoerd via de admin-UI

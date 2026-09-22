# Fase 7 — Offline & Synchronisatie (nieuw, toegevoegd na klantfeedback)

Uren: **70**
Afhankelijk van: [Fase 3 — Rekenmotor](./03-rekenmotor.md), [Fase 6 — Order → Productie → Inkoop → Picking/Levering](./06-order-tot-levering.md)
Volgende fase: [Fase 8 — Facturatie](./08-facturatie.md)
Terug naar: [PLAN.md](../PLAN.md) · [ARCHITECTURE.md](../ARCHITECTURE.md)

## Doel

De desktopapplicatie volledig laten functioneren zonder internetverbinding: Foodbook bekijken, bestaande producten/recepten raadplegen, een evenement/order bewerken, de rekenmotor draaien, en documenten genereren/printen — allemaal lokaal. Zie de volledige onderbouwing in [ARCHITECTURE.md §7](../ARCHITECTURE.md#7-offline-operation-local-data--sync).

## Waarom deze fase bestaat

De oorspronkelijke architectuur ging uit van een dunne desktop-client die altijd met de server praat. Dat werkt niet offline. Deze fase verandert dat structureel naar een local-first opzet: een lokale database in de app zelf, met de centrale PostgreSQL-database als bron van waarheid voor synchronisatie, back-up en meerdere apparaten — niet als enige plek waar data bestaat.

## Acties

1. SQLite inrichten binnen de Tauri-app, met een schema dat het relevante deel van het centrale PostgreSQL-schema spiegelt (producten, recepten, ingrediënten, allergenen, klanten, evenementen/orders van de betreffende gebruiker).
2. Eerste-opstart/onboarding-flow: bij installatie haalt de app de actuele catalogus (producten/recepten/prijzen/allergenen/foto's) op en slaat deze lokaal op.
3. `calculation-engine` (Fase 3) zo aansluiten dat deze tegen de lokale SQLite-data draait binnen de desktop-app, zonder netwerkafhankelijkheid.
4. Documentenmotor (Fase 9) zo aansluiten dat PDF-generatie en preview volledig lokaal werken, geen serveraanroep nodig voor renderen.
5. Pull-synchronisatie bouwen: bij elke succesvolle verbinding worden wijzigingen in gedeelde data (producten/recepten/prijzen/allergenen/foto's) opgehaald.
6. Push-synchronisatie bouwen: lokaal aangemaakte/bewerkte records (nieuwe evenementen, orders, offertes) worden in een wachtrij gezet en verstuurd zodra er weer verbinding is.
7. Eenvoudige conflictdetectie: "gewijzigd sinds jouw laatste synchronisatie"-melding bij gedeelde data, met last-write-wins als standaardgedrag (bewust simpel gehouden voor v1, zie ARCHITECTURE.md §7.3).
8. E-mail-wachtrij: als een document verstuurd wordt zonder verbinding, wordt de verzending in de wachtrij gezet en automatisch alsnog verstuurd zodra de verbinding terugkeert — gebruiker krijgt hier duidelijke feedback over.
9. Lokale back-up van het SQLite-bestand (bijv. dagelijkse rollende kopie) zodat een machinestoring geen tussentijds werk verliest.
10. Verbindingsstatus zichtbaar maken in de UI (online/offline-indicator, wachtrijstatus voor niet-verzonden e-mails/synchronisatie).

## Klaar is klaar

- [ ] Applicatie volledig functioneel zonder internetverbinding: Foodbook bekijken, evenement bouwen, rekenmotor gebruiken, document genereren/printen/PDF opslaan
- [ ] E-mailen van een document werkt automatisch alsnog zodra de verbinding terugkeert, na offline verzending
- [ ] Synchronisatie haalt centrale wijzigingen correct op en stuurt lokale wijzigingen correct terug
- [ ] Conflictmelding verschijnt correct bij gelijktijdige wijziging van dezelfde gedeelde data
- [ ] Lokale back-up van de SQLite-data functioneert en is getest door een machine "uit te zetten" midden in gebruik

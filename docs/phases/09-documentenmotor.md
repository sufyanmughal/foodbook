# Fase 9 — Documentenmotor

Uren: **45**
Afhankelijk van: [Fase 5](./05-klanten-evenementen-offertes.md), [Fase 6](./06-order-tot-levering.md), [Fase 8 — Facturatie](./08-facturatie.md)
Volgende fase: [Fase 10 — Windows-verpakking](./10-windows-verpakking.md)
Terug naar: [PLAN.md](../PLAN.md) · [ARCHITECTURE.md](../ARCHITECTURE.md)

## Doel

Met één klik elk operationeel document genereren, bekijken, printen, als PDF opslaan of e-mailen — zie [ARCHITECTURE.md §5](../ARCHITECTURE.md#5-document-generation-engine).

## Acties

1. `packages/documents` opzetten: gedeelde React-sjablooncomponenten die zowel op scherm als naar PDF renderen.
2. PDF-renderpijplijn inrichten (`@react-pdf/renderer` of Puppeteer HTML→PDF) — één keer bouwen, door alle sjablonen hergebruikt.
3. Gedeelde actiebalk-component: "Bekijken / Printen / PDF downloaden / E-mailen" — herbruikt op elk documenttype.
4. Bedrijfsinstellingen-collection (logo, kleuren, KVK/btw-nummer, standaard voettekst) — door Beheerder zelf aanpasbaar, gebruikt in elk sjabloon.
5. Sjabloon: **Offerte** — regels, prijzen, btw, voorwaarden, geldigheidsdatum.
6. Sjabloon: **Orderbevestiging**.
7. Sjabloon: **Voedsel-bestellijst / Productielijst** — geschaalde ingrediënten per recept, gegroepeerd per keukenstation.
8. Sjabloon: **Keukenlijst** — kookinstructies + timing, keukenvriendelijke opmaak.
9. Sjabloon: **Inkooplijst** (voedsel/ingrediënten) — gegroepeerd per leverancier.
9b. Sjabloon: **Materialenlijst** (niet-voedsel, apart document) — materialen/uitrusting per evenement, incl. automatisch gekoppelde materialen vanuit producten/menu's (§3.8).
10. Sjabloon: **Picking/Paklijst** — afvinkbare opmaak.
11. Sjabloon: **Leveringslijst** — adres, tijd, chauffeur, inhoudsoverzicht.
12. Sjabloon: **Allergenenlijst** — heldere, wettelijk verdedigbare allergenenmatrix per gerecht (hoogste zorgvuldigheid van alle sjablonen).
13. Sjabloon: **Factuur** — sequentienummer, btw per tarief, betaalvoorwaarden.
14. E-mailfunctionaliteit: verzendknop per document, vooraf ingevuld vanuit klantgegevens, bewerkbaar onderwerp/bericht, PDF als bijlage, verzendlog vastgelegd tegen het Evenement.
15. Alle sjablonen volledig Nederlands via de i18n-laag uit Fase 1.

## Klaar is klaar

- [ ] Alle 10 documenttypes (incl. aparte Materialenlijst) genereren correct als PDF, printbaar, en verstuurbaar per e-mail
- [ ] Elk document trekt live/bevroren data uit de juiste bron (Offerte/Order/Productie/Inkoop/Materialen/Picking/Levering/Factuur)
- [ ] Inkooplijst en Materialenlijst zijn aantoonbaar twee gescheiden documenten, nooit samengevoegd
- [ ] Bedrijfslogo/gegevens zijn door Beheerder zelf aan te passen en verschijnen correct op elk document
- [ ] Allergenenlijst is duidelijk leesbaar en correct per gerecht
- [ ] Verzendlog toont wie welk document wanneer naar welke klant heeft gestuurd

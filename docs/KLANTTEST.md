# Klanttest — documenten beoordelen

Dit is de eerste testronde. Hierin kan de klant de **documenten** beoordelen die het systeem
genereert voor één evenement van 250 gasten. Nog niet getest kan worden: schermen, database en
e-mailverzending — zie "Wat nog niet getest kan worden" onderaan.

De documenten staan in `voorbeelddocumenten/` en zijn per stuk te openen. Ze worden gegenereerd
door `npm run voorbeeld`.

---

## 1. Hoe je de documenten bekijkt

Er zijn drie vormen van elk document:

| Vorm | Bestand | Waarvoor |
|---|---|---|
| **PDF** | `*.pdf` | Doorsturen, printen, archiveren. Dit is de vorm die de klant uiteindelijk krijgt. |
| **HTML** | `*.html` | Zelfstandig bestand van ± 7 KB zonder externe bestanden: als bijlage te mailen en in elke browser te openen. Met Ctrl+P zie je precies de afdrukopmaak. |
| **PNG** | `*.png` | Schermafbeelding, om snel in een app of mail te bekijken. |

De **allergenenlijst is liggend** (A4 landscape). Kantel je beeldscherm of draai de PDF-weergave
als die smal lijkt.

### Wat je het beste eerst doet

1. Open alle zes de PDF's.
2. Loop de checklist hieronder langs.
3. Noteer per punt: **goed**, **aanpassen**, of **ontbreekt**.
4. Stuur de bevindingen terug, ook als er weinig op aan te merken is — dan weten we dat het
   vaststaat.

---

## 2. Checklist per document

### Offerte

Kijk of dit de offerte is die je vandaag ook zou versturen.

- [ ] Staat de juiste informatie erop: klant, datum, aantal gasten, geldig tot, versienummer?
- [ ] Is de prijsopbouw duidelijk (per persoon × aantal gasten)?
- [ ] Staat de btw per tarief apart vermeld (9% en 21%), zoals wettelijk vereist?
- [ ] Mis je velden? Denk aan: contactpersoon, referentie/kenmerk, opmerkingen, akkoordvak, datum/voorwaarden.
- [ ] **Voorwaarden**: de offerte bevat nu geen algemene voorwaarden of tekstblok met afspraken. Wil je dat er standaard tekst op komt (aanbetaling, annulering, wijzigingen)?
- [ ] Is de bedrijfsvoettekst onderaan correct? (Nu een voorbeeldtekst met KVK, btw en IBAN.)

### Productielijst

Dit is de lijst voor de keuken.

- [ ] Krijgt de keuken hier genoeg aan? De regels zijn nu gegroepeerd per **keukenstation** (Warme keuken / Koude keuken).
- [ ] Hoeveelheden staan **exact** (18.000 gram, 3.000 ml) — is dat de prettige notatie voor de keuken, of wil je liever 18 kg / 3 liter?
- [ ] Moet er een kolom bij, bijvoorbeeld per gerecht het aantal gasten of de portiegrootte?
- [ ] Is de sortering binnen een station logisch?

### Allergenenlijst

Dit is het gevoeligste document. Kijk hier extra goed naar.

- [ ] Is deze vorm bruikbaar zoals je hem aan een locatie of klant geeft?
- [ ] De allergenen staan als **rij** en de gerechten als **kolom**, liggend afgedrukt. Werkt dat voor jou, of wil je liever een andere vorm (bijvoorbeeld per gerecht een regel met "bevat: ...", wat nog eenvoudiger leest)?
- [ ] Zijn dit de juiste **14 wettelijke allergenen**? Ze staan er allemaal op, ook degene die in geen enkel gerecht zitten — zodat zichtbaar is dat er op alle is gecontroleerd. Is dat wenselijk, of geeft dat te veel ruis?
- [ ] Een X betekent "bevat dit allergeen". Is dat direct duidelijk genoeg, of moet er "bevat"/"-" staan?
- [ ] **Belangrijk:** producten zonder recept (zoals ingekochte wijn en brood) krijgen alleen allergenen als ze handmatig zijn getagd. In deze voorbeelddata zijn brood (gluten, melk) en wijn (sulfiet) met de hand getagd. Zonder die tags zouden ze als allergeenvrij op de lijst staan. Wil je dat het systeem hier een **waarschuwing** geeft bij een product waarvan geen allergenen bekend zijn?
- [ ] Zodra een allergeen centraal wijzigt, verandert deze lijst mee op het moment dat je hem opnieuw genereert. Wil je dat, of moet een verzonden lijst bevroren blijven?

### Inkooplijst

- [ ] De regels zijn gegroepeerd per **leverancier**. Is dat de indeling waarop je inkoopt?
- [ ] Hoeveelheden zijn **naar boven afgerond op de inkoopeenheid** (45 kg zalm, 8 liter room). Klopt dat met hoe je inkoopt, of wil je de exacte behoefte er ook naast zien?
- [ ] Onderaan staat de **materialenlijst** als aparte sectie. De klant gaf eerder aan dit als **zelfstandig document** te willen — bevestig dat, dan splitsen we het.
- [ ] Staat de inkoopkostprijs erop en is dat gewenst op de lijst die naar de keuken of inkoop gaat?

### Paklijst

- [ ] Voedsel en materialen staan in één lijst met afvinkvakjes. Klopt deze combinatie?
- [ ] Is de volgorde praktisch voor het inpakken?
- [ ] Moet er een regel bij voor "wie heeft afgevinkt" en "wanneer"?

### Factuur

- [ ] Is het **factuurnummer** (`F2026-0001`) het formaat dat je gewend bent? Pas de prefix aan in de bedrijfsinstellingen.
- [ ] Btw per tarief apart, subtotaal en totaal — correct?
- [ ] **Verplichte factuurgegevens**: staan je volledige bedrijfsnaam, adres, KVK en btw-nummer erop? (Nu voorbeeldgegevens.) Aan een factuur zonder die gegevens is de klant niets verschuldigd, dus dit moet kloppen.
- [ ] Betaalgegevens (IBAN) en betalingstermijn (30 dagen) — correct?
- [ ] Moet er een omschrijving per regel bij, of is de huidige regelopbouw goed?

---

## 3. Wat we van de klant nodig hebben

1. **Bedrijfsgegevens**: officiële bedrijfsnaam, adres, KVK, btw-nummer, IBAN, telefoon, e-mail — dit komt op elk document.
2. **Logo** (aanleveren als bestand) en de gewenste **huisstijlkleuren**.
3. **Standaard voettekst** en eventuele **algemene voorwaarden** voor offertes en facturen.
4. **Reactie op de checklist** hierboven, per punt.
5. **Echte voorbeeldproducten**: drie tot vijf gerechten uit de eigen kaart met recept, ingrediënten, allergenen en prijs. Daarmee testen we of het systeem met *jullie* data dezelfde uitkomsten geeft.

---

## 4. Wat nog niet getest kan worden

Deze testronde gaat alleen over **documenten en berekeningen**. Nog niet te testen:

| Onderdeel | Waarom nog niet |
|---|---|
| Beheeromgeving (schermen) | Er is nog geen database aangesloten op deze machine; de schermen zijn wel gebouwd maar nooit gestart. |
| Zelf een evenement aanmaken | Idem — vereist de beheeromgeving. |
| Document per e-mail versturen | De verzendfunctie is nog niet gebouwd. |
| Product/foto zelf toevoegen | Idem — vereist de beheeromgeving. |

Zodra er een database draait, kan de klant **zelf** producten toevoegen, een evenement opbouwen,
het aantal gasten wijzigen en de documenten met één klik genereren. Dat is de tweede testronde en
die sluit aan op de acceptatietest uit de klantvraag
(`Event → Berekening → Offerte → Voedsel-lijst → Materialenlijst → Allergenenlijst → PDF → Print → E-mail`).

### Twee manieren om die tweede ronde te starten

1. **Docker Desktop installeren** en `npm run db:up` draaien — dat is de opzet die in de
   architectuur staat (PostgreSQL). Meest representatief voor de uiteindelijke installatie.
2. **Zonder Docker, met een lokale database** — dan kan de beheeromgeving direct starten zonder
   dat er iets geïnstalleerd hoeft te worden. Sneller om te testen, maar het is niet de
   database die uiteindelijk in productie gaat. Dit is een keuze die bevestigd moet worden
   voordat we het inbouwen (zie BESLISSINGEN.md).

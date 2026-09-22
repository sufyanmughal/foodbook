# Beslissingenlog

Vastlegging van beslissingen die tijdens de bouw genomen worden en die de vastgelegde scope raken of verduidelijken. Zie [PLAN.md](./PLAN.md) en [ARCHITECTURE.md](./ARCHITECTURE.md) voor de basis waartegen deze beslissingen worden getoetst.

| Datum | Beslissing | Reden | Vastgelegd door |
|---|---|---|---|
| 2026-09-19 | `Recept` krijgt twee extra velden: `hoeveelheidPerPersoon` en `eenheid` | Noodzakelijke ijkwaarde voor de formule in §4.1 — zie B1 hieronder | Bouw |
| 2026-09-19 | De rekenmotor werkt intern in basis-eenheden (gram / ml / stuk) | Eenheden van dezelfde dimensie moeten optelbaar zijn — zie B2 | Bouw |
| 2026-09-19 | Inkoopafronding gebeurt ná aggregatie over evenementen, niet per evenement | Voorkomt structureel te veel inkopen — zie B3 | Bouw |
| 2026-09-19 | Btw per tarief wordt berekend over de gegroepeerde grondslag, niet per losse regel | Voorkomt afrondingsverschillen van een cent op de factuur — zie B4 | Bouw |
| 2026-09-19 | `Product.hoeveelheidPerPersoon` beïnvloedt hoeveelheden en kostprijs, niet de verkoopprijs | §4.2 zegt expliciet dat verkoopprijzen niet uit kosten worden afgeleid — zie B5 | Bouw |
| 2026-09-19 | Bedrijfsinstellingen is een Payload *global* in plaats van een collectie | Het is per definitie één record; een collectie zou meerdere rijen toestaan — zie B6 | Bouw |
| 2026-09-19 | Payload draait embedded in dezelfde Next.js-app als de Foodbook | ARCHITECTURE.md §6 liet dit expliciet open ("confirm during setup") — zie B7 | Bouw |
| 2026-09-19 | De documentenmotor is gesplitst in een puur datamodel en een aparte renderschil | Het model is los testbaar; de PDF/React-laag heeft zware dependencies — zie B8 | Bouw |
| 2026-09-19 | De Tauri-desktopapp is een dunne schil rond de Next.js-server | Payload heeft een server en database nodig; zie B9 en de openstaande vraag O1 | Bouw |
| 2026-09-19 | De allergenenmatrix staat liggend, met allergenen als rij en gerechten als kolom | Een liggende matrix is de enige leesbare vorm — zie B10 | Bouw |
| 2026-09-19 | PDF's worden gerenderd met de systeem-Edge/Chrome, niet met een meegebundelde Chromium | Houdt het installatiebestand klein — zie B11 | Bouw |
| 2026-09-19 | Zonder `DATABASE_URI` draait de applicatie op SQLite in plaats van PostgreSQL | Maakt starten en testen mogelijk zonder Docker — zie B12 | Bouw |
| 2026-09-19 | Centrale opslag in v1; geen offline synchronisatie | Klantbeslissing: meerdere mensen op dezelfde gegevens weegt zwaarder dan offline werken — zie B13 | Klant |
| 2026-09-19 | Automatische back-up en een herstelprocedure horen in v1 | Klantbeslissing: bij centrale opslag moet het beheer op orde zijn — zie B13 | Klant |
| 2026-09-19 | Materialen worden aan producten gekoppeld en automatisch per gast berekend; handmatig aanvullen blijft mogelijk | Klantbeslissing: expliciet in v1-scope — zie B14 | Klant |
| 2026-09-19 | De materialenlijst wordt een zelfstandig document, los van de inkooplijst | Klantbeslissing: voedsel en materiaal zijn twee verschillende processen — zie B14 | Klant |
| 2026-09-19 | Het systeem waarschuwt bij een product zonder recept én zonder allergenen | Klantbeslissing: nooit stilzwijgend allergeenvrij veronderstellen — zie B15 | Klant |
| 2026-09-19 | Recept- en allergeneninformatie wordt vastgelegd op het moment dat een evenement wordt bevestigd | Klantbeslissing: een gewijzigd recept mag een afgerond evenement niet met terugwerkende kracht veranderen — zie B15 | Klant |
| 2026-09-19 | Acceptatietest: 250 → 300 gasten en zalm 180 → 160 gram, plus de bevroren offerte | Klantbeslissing: formeel als definitie van "v1 klaar" — zie B16 | Klant |
| 2026-09-19 | Eén documentstandaard: A4 staand, 14 mm marge, schermweergave gelijk aan papier | Eén paginamaat voor alles; geen liggende uitzonderingen — zie B17 | Bouw |

*(Beslissingen die de klant moet bevestigen staan apart onder "Openstaande vragen" hieronder.)*

---

## Toelichting per beslissing

### B1 — Ijkwaarde in het recept (§4.1)

De formule in §4.1 schrijft voor dat de effectieve `hoeveelheid_per_persoon` van het product de
ingrediënthoeveelheden laat meeschalen. De formule noemt daarbij een deling door
`Recipe.basis_porties`, maar laat de referentieportie zelf onbenoemd. Zonder een expliciete
ijkwaarde is de klanteis uit Fase 10 ("180g → 160g, alles herberekent") niet te implementeren:
een wijziging van `Product.hoeveelheidPerPersoon` zou dan tegen zichzelf wegvallen.

Daarom draagt het recept de portiegrootte waarop zijn regels zijn gebaseerd:

```
schaal = (hoeveelheidPerPersoon_effectief × aantalGasten_effectief)
       ÷ (recept.hoeveelheidPerPersoon × recept.basisPorties)
```

Zonder overrides is de schaal precies `aantalGasten ÷ basisPorties`, wat exact de formule uit
§4.1 is. `hoeveelheidPerPersoon_effectief` komt uit de eventregel-override, anders uit het product.

### B2 — Basis-eenheden in de rekenmotor

Ingrediënten worden ingekocht in kg/liter, recepten rekenen vaak in gram/ml. Om die optelbaar en
vergelijkbaar te maken, normaliseert de motor alles naar de basis-eenheid van de dimensie
(massa → gram, volume → ml, aantal → stuk). Een receptregel die in stukken staat bij een
ingrediënt dat per kilo wordt ingekocht is een datafout en levert een expliciete `RekenFout` op
in plaats van een stil verkeerd getal.

### B3 — Aggregeren vóór afronden (§4.4)

Als elk evenement apart naar boven wordt afgerond, koopt de keuken structureel te veel in:
drie evenementen van 1,08 kg zalm zouden 3 × 2 = 6 kg opleveren, terwijl er 3,24 kg nodig is en
dus 4 kg volstaat. De inkooplijst telt daarom eerst de exacte behoeften op over alle producties in
de periode, trekt de voorraad af, en rondt dan pas af op de inkoopeenheid. Productie- en
keukenlijsten blijven exact.

### B4 — Btw over de gegroepeerde grondslag

Op een factuur met gemengde tarieven (9% en 21%) wordt de btw per tarief berekend over de som van
de grondslagen van dat tarief. Per regel afronden en daarna optellen kan een cent afwijken van het
totaal. De btw-uitsplitsing per tarief is daarmee de autoriteit; het btw-bedrag op een losse regel
is informatief.

### B5 — Verkoopprijs niet afgeleid van kostprijs

§4.2 stelt dat klantprijzen uit `Product.prijsPerPersoon` komen en "een ondernemersbeslissing zijn,
geen formule". Daarom geldt: `regeltotaal = prijsPerPersoon × aantalGasten`. Een wijziging van
`hoeveelheidPerPersoon` verandert de ingrediëntbehoefte en de kostprijs/marge, maar niet de
verkoopprijs. De marge is dus zichtbaar te maken zonder de prijs te kantelen.

### B6 — Bedrijfsinstellingen als global

ARCHITECTURE.md §6 en Fase 8 actie 4 noemen een "Bedrijfsinstellingen-collection". Er is per
definitie precies één set bedrijfsgegevens, en een collectie zou per ongeluk meerdere rijen kunnen
bevatten — waarna onduidelijk is welke op een factuur terechtkomt. Payload heeft voor dit patroon
een *global*; die is gebruikt. Functioneel identiek, maar met één record afgedwongen door het
datamodel.

### B7 — Payload embedded in dezelfde Next.js-app

ARCHITECTURE.md §6 liet de keuze tussen een aparte `apps/admin` en een embedded Payload open, met
de opmerking dit bij setup te bevestigen. Payload 3 is zelf een Next.js-app; embedden betekent één
server, één deployment en geen dubbele authenticatielaag. De map `apps/admin` uit §6 is daarom niet
aangemaakt. `apps/web` bevat zowel de beheeromgeving (`/admin`) als de Foodbook (`/`).

### B8 — Documentenmotor in twee lagen

`packages/documents` bouwt nu het **documentmodel**: een volledig uitgerekend, van Nederlandse
labels voorzien model per documenttype, zonder enige React-afhankelijkheid. Daardoor zijn alle
negen documenttypes los te testen (24 tests). De renderschil — React-sjablonen plus
`@react-pdf/renderer` of Puppeteer — bouwt op datzelfde model en verandert de inhoud niet meer.
Deze splitsing volgt de motivering in §6 om de rekenkern geïsoleerd en testbaar te houden.

### B9 — Tauri als dunne schil

Payload heeft een draaiende server en een database nodig, dus een volledig statische export van de
Next.js-app is niet mogelijk zonder de beheeromgeving op te geven. De desktopapp laadt daarom de
Next.js-server in de OS-webview (lokaal of gehost, zie Fase 9 actie 3). Dit houdt één codebase voor
web en desktop en maakt de macOS-build later een kwestie van een andere target.

### B10 — Liggende allergenenmatrix met allergenen als rij

De eerste opzet zette de veertien wettelijke allergenen als kolom en de gerechten als rij. Bij het
visueel controleren van een evenement met acht gerechten bleek dat onleesbaar: de lange
Nederlandse namen ("Glutenbevattende granen", "Zwaveldioxide en sulfieten") overlapten elkaar
volledig. Fase 8 vraagt juist om een *heldere, wettelijk verdedigbare* allergenenmatrix, en een
onleesbare allergenenlijst is in de praktijk erger dan geen.

Daarom is de matrix omgedraaid — allergenen als rij, gerechten als kolom — en wordt de
allergenenlijst liggend (A4 landscape) afgedrukt. Omdat een matrix met veel gerechten ook dan te
breed wordt, wordt een menu vanaf zeven gerechten in meerdere matrices gesplitst ("deel 1 van 2").
Elk wettelijk allergeen houdt een eigen rij, ook als het in geen enkel gerecht voorkomt, zodat
zichtbaar blijft dat er op alle veertien is gecontroleerd; de rijen die daadwerkelijk voorkomen
worden benadrukt. De wettelijke code staat achter de naam in de rij, wat de aparte legenda
overbodig maakt.

### B11 — PDF via de systeembrowser in plaats van een meegebundelde Chromium

De PDF-renderer gebruikt `puppeteer-core` tegen de Edge of Chrome die al op de machine staat, in
plaats van `puppeteer` met een eigen Chromium-download. Reden: ARCHITECTURE.md §2 kiest Tauri
juist omdat het een kleine binary oplevert die de OS-webview gebruikt in plaats van een
meegebundelde browser. Een Chromium van ruim 300 MB in het installatiebestand zou dat voordeel
tenietdoen, terwijl Edge op elke Windows-machine aanwezig is. Via `CHROME_PAD` is een ander pad te
configureren; voor de productie-opstelling is de aanwezigheid van de browser een punt van
aandacht (zie hieronder).

### B12 — SQLite als standaard wanneer er geen database is geconfigureerd

De applicatie start zonder `DATABASE_URI` op SQLite: één lokaal bestand, zonder Docker en zonder
databaseserver. Reden: de klant wil zelf kunnen meekijken en rekenen, en het ontbreken van een
database was tot nu toe de enige reden dat de beheeromgeving niet wilde starten — daarmee was er
niets om te testen, ook al was de rekenkern klaar.

Zodra `DATABASE_URI` wél is gezet, gebruikt de applicatie PostgreSQL: de opzet uit
ARCHITECTURE.md §2 en de database waarin het systeem bij de klant komt te draaien.

**Dit is een ontwikkel- en testvoorziening, geen productiekeuze.** SQLite en PostgreSQL gedragen
zich op details anders (typen, gelijktijdigheid, sortering). De acceptatietest uit de klantvraag
hoort daarom tegen **PostgreSQL** te worden uitgevoerd, niet tegen een SQLite-bestand. Zie ook O1.

### B13 — Centrale opslag, geen offline synchronisatie (klantbeslissing)

De klant kiest voor één centrale database in v1. Meerdere bevoegde personen moeten met dezelfde
producten, recepten, klanten en evenementen kunnen werken; dat weegt zwaarder dan op één computer
kunnen doorwerken zonder internet. Offline synchronisatie wordt **niet** in v1 opgenomen — dat
zou de complexiteit en de kosten aanzienlijk vergroten.

De Windows-applicatie mag dus een internetverbinding vereisen voor toegang tot de centrale
gegevens.

**Wat hieruit volgt:** PostgreSQL is de productiekeuze (SQLite is alleen voor lokaal testen, B12),
en er horen **automatische back-ups plus een bewezen herstelprocedure** bij, zodat de gegevens
tegen verlies beschermd zijn. Die back-up en het herstel zijn nog te bouwen; ze staan als stap 5
in [STATUS.md](./STATUS.md).

Dit beantwoordt vraag O1 voor een belangrijk deel: de server komt centraal te staan, niet mee in
het installatiebestand per werkplek.

### B14 — Materialen als eigen module, automatisch berekend per gast (klantbeslissing)

Materialen (borden, bestek, gastronorm, warming, servies) worden een **zelfstandige module** met
een **eigen document**, los van de voedselinkoop. Voedsel loopt via recepten naar productie en
inkoop; materialen lopen via een eigen berekening naar de materialenlijst.

De klant wil in v1:

1. Materialen koppelen aan een product of menu met een hoeveelheid **per aantal gasten**, zodat de
   benodigde aantallen automatisch meerekenen.
2. Daarnaast materialen **handmatig** kunnen toevoegen of bijstellen voor een specifiek evenement.

Dus: automatisch waar het kan, handmatig waar nodig. De materialenlijst moet gegenereerd,
geprint, als PDF opgeslagen en gemaild kunnen worden — net als de andere documenten.

**Wat dit raakt:** een uitbreiding op `Product` (materiaalregels per gast), een berekening in de
rekenmotor naast de bestaande recept-explosie, en een nieuw documenttype. De bestaande
`EventMateriaalRegel` blijft bestaan als de handmatige aanvulling.

### B15 — Allergenen: waarschuwen en vastleggen (klantbeslissing)

Twee veiligheidsmaatregelen die de klant expliciet wil:

1. **Waarschuwen bij ontbrekende informatie.** Een product zonder recept én zonder ingevulde
   allergenen mag nooit stilzwijgend als allergeenvrij op een lijst komen. Het systeem moet daar
   een duidelijke waarschuwing bij geven. Dit sluit aan op wat er in de voorbeelddata misging: een
   ingekocht stokbrood zonder gluten-tag en een wijn zonder sulfiet-tag.

2. **Vastleggen bij bevestiging.** De centrale ingrediënt- en receptdatabase blijft altijd actueel.
   Maar zodra een evenement of order **bevestigd** wordt, wordt de dan geldende recept- en
   allergeneninformatie als momentopname bij dat evenement vastgelegd. Een receptwijziging volgende
   week verandert dus geen afgerond evenement meer. Voor een nieuw evenement geldt de nieuwste
   informatie; voor een bevestigd historisch evenement geldt wat toen van toepassing was.

Dit is strenger dan de rest van het systeem, waar offertes en facturen al bevroren zijn maar de
allergenenlijst tot nu toe altijd live werd afgeleid. De klant heeft hier expliciet voor gekozen —
terecht, want een allergenenlijst is het gevoeligste document dat het systeem voortbrengt.

### B16 — Formele acceptatietest (klantbeslissing)

De klant legt de acceptatietest formeel vast als definitie van "v1 klaar":

1. Gastenaantal **250 → 300**: alles stroomafwaarts moet correct meeschalen.
2. Zalm **180 gram → 160 gram per persoon**: de hoeveelheden moeten meebewegen.
3. Daarna de hele keten: evenement → berekening → offerte → productie → inkoop → materialen →
   allergenen → picking → levering → factuur → PDF → print → e-mail.

De test is geautomatiseerd als `npm run acceptatietest -w @foodbook/web`. De eerste twee
onderdelen **slagen**; het derde kan pas volledig groen zijn als de rest van de keten en het
e-mailen gebouwd zijn.

### B17 — Eén documentstandaard, voor alles

De eerste opzet had geen vaste standaard. Er waren drie verschillende tekstbreedtes: het scherm
gebruikte `max-width: 210mm` met een eigen padding, de printer gebruikte `@page` met een andere
marge, en de allergenenlijst had een liggende uitzondering die alleen op het scherm gold. Wat je
op het scherm zag was dus nooit precies wat er uit de printer kwam, en de documenten hadden
onderling verschillende afmetingen.

Dat is rechtgetrokken met één standaard die voor élk document geldt:

| | |
|---|---|
| Papier | **A4 staand** (210 × 297 mm), zonder uitzonderingen |
| Marge | **14 mm** rondom |
| Tekstbreedte | **182 mm** (210 − 2 × 14) |
| Basistekst | 10,5 pt |

De marge staat op twee plekken die hetzelfde uitkomen: op het scherm als `padding` op het document,
op papier als `@page { margin: 14mm }` met het document zelf op `padding: 0`. Daardoor is de
tekstbreedte in beide gevallen 182 mm, en is de schermweergave een eerlijke voorstelling van het
vel: met schaduw en grijze ondergrond op het scherm, zonder op papier.

De **allergenenlijst is niet langer liggend**. Die was liggend gemaakt omdat veertien lange
allergeennamen als kolomkop onleesbaar werden, maar dat loste het probleem op door de standaard te
verlaten. Nu blijft het document staand en worden er **vier gerechten per matrix** getoond in
plaats van zes, zodat de kolommen ruim genoeg zijn. Een menu met meer gerechten krijgt meerdere
matrices onder elkaar. Dat is dezelfde informatie op dezelfde pagina, zonder uitzondering.

Gecontroleerd op de gegenereerde PDF's: alle zeven hebben een MediaBox van 594,96 × 841,92 punten,
wat exact A4 staand is. Nul afwijkingen.

---

## Openstaande vragen (klantbevestiging nodig)

### O1 — Draait de server mee in het installatiebestand, of is die gehost?

Fase 9 vraagt om een installatiebestand dat op een schone Windows-machine werkt *zonder
ontwikkelomgeving* (klaar-is-klaar-eis). Dat kan op twee manieren:

1. **Lokale server als sidecar**: het `.msi` bundelt een Node-server plus een lokale database, en
   de webview praat met `localhost`. Werkt volledig offline, maar elke werkplek heeft dan een eigen
   database; samenwerken op één dataset vereist alsnog een gedeelde server.
2. **Gehoste server**: het `.msi` is een dunne client naar één centrale server. Alle werkplekken
   zien dezelfde data, maar er is een server en internetverbinding nodig.

Dit raakt de scope en de kosten, dus dit is een expliciete vraag aan de klant voordat Fase 9 wordt
afgerond. De huidige configuratie ondersteunt beide; alleen de packaging verschilt.

### O2 — Blijft de Foodbook-presentatie in-app, of wordt die ook als webpagina gepubliceerd?

De media-collectie legt al alt-tekst vast (§3.9) zodat publicatie later mogelijk is, maar v1 gaat
uit van in-app browsen. Publiceren zou een publieke leesroute en hosting toevoegen — buiten de
huidige scope.

---

## Aandachtspunten voor later (geen beslissing nodig)

- **Factuurnummering en gelijktijdigheid.** `bepaalVolgendFactuurNummer` kijkt naar het hoogste
  bestaande nummer binnen jaar en prefix. Bij gelijktijdig aanmaken vanaf meerdere werkplekken is
  een database-lock nodig om dubbele nummers uit te sluiten. In de v1-opstelling (één gebruiker per
  installatie, zie O1) is dat niet aan de orde; bij een gehoste server moet dit vóór livegang
  worden dichtgezet.
- **Voorraad in de inkoopberekening.** `Ingredient.voorraad` staat in de inkoopeenheid en wordt
  omgerekend naar de basis-eenheid voordat hij van de behoefte wordt afgetrokken. Dit is met een
  test afgedekt; het is een plek waar een eenheidsfout stil een verkeerde inkooplijst zou opleveren.

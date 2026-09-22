# Stand van zaken

Bijgewerkt: 19 september 2026
Omvang: **± 9.000 regels**, 151 geautomatiseerde tests, plus een geautomatiseerde acceptatietest.

Dit document beschrijft wat er staat, wat bewezen werkt, wat er nog niet is en wat de
eerstvolgende stappen zijn. Zie [PLAN.md](./PLAN.md) voor het bouwplan,
[ARCHITECTURE.md](./ARCHITECTURE.md) voor het ontwerp en [BESLISSINGEN.md](./BESLISSINGEN.md)
voor de keuzes.

---

## 1. In één alinea

**De applicatie werkt en kan rekenen.** Je kunt inloggen, de catalogus beheren, een evenement
openen, het aantal gasten wijzigen, zien wat er nodig is aan ingrediënten, inkoop, kosten en marge,
en met één klik de zes documenten genereren — als pagina én als PDF. De acceptatietest die met de
klant is afgesproken (250 → 300 gasten, zalm 180 → 160 gram, en een bevroren offerte die niet
meebeweegt) **slaagt en is herhaalbaar gemaakt**. Wat nog ontbreekt zijn de vier punten die de
klant in zijn laatste bericht heeft toegevoegd: materialen die automatisch meerekenen, allergenen
vastleggen bij bevestiging, de waarschuwing bij producten zonder allergenen, en automatische
back-ups.

---

## 2. Wat er staat en bewezen werkt

### Rekenmotor — `packages/calculation-engine` (89 tests)

Alle rekenregels uit ARCHITECTURE.md §4: schaling volgens §4.1 met overrides per evenementregel,
allergenen-propagatie (§4.3), de twee afrondingsregels (§4.4), kostprijs en marge strikt gescheiden
van de verkoopprijs (§4.2), btw per tarief, bevroren offertes, gapless factuurnummering,
productie-explosie, inkoopaggregatie en paklijsten.

### Documentenmotor — `packages/documents` (46 tests)

Alle negen documenttypes uit §5, plus één gedeeld React-sjabloon dat naar scherm, print en PDF
rendert met echte printopmaak (A4, geen tabelrij over twee pagina's, herhalende kolomkoppen).
Inclusief HTML-escaping: een productnaam met `<script>` erin wordt als tekst weergegeven, en een
`javascript:`-logo-URL wordt geweigerd.

De **allergenenmatrix** staat liggend, met allergenen als rij en gerechten als kolom — de eerste
opzet was onleesbaar en is omgebouwd (B10). Grote menu's worden in meerdere matrices gesplitst.

### De keten — `apps/web/src/diensten/`

De laag die de rekenmotor daadwerkelijk aanroept: een evenement uit de database lezen en omzetten
naar de dataset van de motor, doorrekenen, en een offerte als bevroren snapshot wegschrijven.

### De applicatie

- **Rekenscherm** (`/rekenen`): kies een evenement, wijzig het aantal gasten, zie direct de
  ingrediëntbehoefte, inkooplijst, offerte met btw-uitsplitsing, marge en allergenen per gerecht
- **Offerte genereren**: maakt een bevroren snapshot en zet de evenementstatus door
- **Documenten** (`/documenten/<type>/<evenement>`): alle zes documenten als printbare pagina, met
  een knop naar de PDF
- **PDF** (`/documenten/<type>/<evenement>/pdf`): gerenderd met de browser op de machine
- Beheeromgeving met **22 collecties** en rolrechten volgens §3.17, volledig Nederlands
- Nederlandse berichtencatalogus (`packages/i18n`) met getypeerde berichtpaden: een typefout in een
  sleutel is een compilatiefout in plaats van een ontbrekend label op een factuur

### Bewezen, niet alleen geschreven

| Wat | Bewijs |
|---|---|
| Acceptatietest | **GESLAAGD** op alle drie de onderdelen, zie hieronder |
| Alle zes documenten | Pagina én PDF, met inlog, gecontroleerd met echte HTTP-verzoeken |
| Rekenregels | 151 tests |
| Applicatie | Start met één commando, `/admin` en `/rekenen` werken |

**De acceptatietest in cijfers:**

```
Uitgangssituatie    250 gasten · zalm 180 g p.p. · 45.000 gram · verkoop € 6.875,00 · totaal € 7.658,75
Stap 1: 300 gasten  300 gasten · zalm 180 g p.p. · 54.000 gram · verkoop € 8.250,00 · totaal € 9.190,50
                    → alles schaalt met factor 1,20                                    GESLAAGD
Stap 2: 180 → 160g  → ingrediënten schalen met factor 0,889
                    → verkoopprijs blijft gelijk (§4.2)                                GESLAAGD
Stap 3: offerte     € 9.190,50 vóór en ná een prijswijziging van € 19,75 naar € 99    GESLAAGD
```

Herhaalbaar met `npm run acceptatietest -w @foodbook/web`. De test zet de waarden daarna terug.

### Uitrolvoorbereiding

`Dockerfile` met drie fasen en Chromium voor PDF op de server, `infra/docker-compose.prod.yml` met
PostgreSQL en Caddy voor automatisch HTTPS, een aparte `migrate`-service zodat het schema in
productie via migraties gaat, en `docs/DEPLOY.md` met de stappen voor een Digital Ocean-server.
Deze bestanden zijn geschreven maar **nog niet gebouwd** — er is geen Docker op de ontwikkelmachine.

### Onderweg gevonden en verholpen

Zeven fouten die alleen aan het licht kwamen door te draaien, niet door te compileren:

1. **Inkoop trok voorraad in kilogrammen van een behoefte in grammen af** — elke inkooplijst te hoog
2. **Turbopack (Next 16) lost `.js` niet op naar `.ts`** — de app bouwde niet
3. **Elke `/admin`-route gaf een 500** — een functie werd van een Server Component naar een Client
   Component doorgegeven; dat moet een server action zijn
4. **De allergenenmatrix was onleesbaar** — veertien lange namen als kolomkop
5. **Next staat `react-dom/server` niet toe in de app-router** — de renderschil moest los van het
   component, en de PDF-route print nu de pagina die Next zelf al rendert
6. **Numerieke id's als tekst doorgeven aan Payload** — gaf "het veld Evenement is ongeldig"
7. **Een leeg bedrijfsgegeven liet het document crashen** — een leeg veld mag nooit een document breken

---

## 3. De beslissingen van de klant (19 september)

Vastgelegd in [BESLISSINGEN.md](./BESLISSINGEN.md) als B13 tot en met B16.

| # | Beslissing | Status |
|---|---|---|
| B13 | Centrale opslag voor v1; **geen** offline synchronisatie | Doorgevoerd — PostgreSQL is de productiekeuze, SQLite alleen voor lokaal testen |
| B13b | Automatische back-up en een herstelprocedure | **Te bouwen** |
| B14 | Materialen als aparte module, automatisch berekend per gast, plus handmatige aanvulling | **Gedaan en getest** |
| B14b | Materialenlijst als zelfstandig document | **Gedaan** — tiende documenttype |
| B15 | Waarschuwing bij een product zonder recept én zonder allergenen | **Gedaan** — op het scherm én in het document |
| B15b | Recept- en allergeneninformatie vastleggen bij bevestiging | **Te bouwen** |
| B16 | Acceptatietest: 250 → 300 gasten, zalm 180 → 160 gram | **Gedaan en geslaagd** |
| B17 | Eén documentstandaard: A4 staand, 14 mm marge, scherm gelijk aan papier | **Gedaan en gecontroleerd op alle PDF's** |

---

## 4. Wat er nog niet is

| Onderdeel | Status |
|---|---|
| **Allergenen vastleggen bij bevestiging (B15b)** | Nu overal live; een gewijzigd recept verandert dus ook een lopend evenement |
| **Automatische back-up en herstel (B13b)** | Nog niet ingericht |
| **E-mailverzending van documenten** | Nog niet gebouwd |
| **Order, productie, inkoop en factuur wegschrijven** | De motor en de offerte kunnen het; de rest van de keten nog niet |
| **Windows-installatiebestand** | Tauri-schema staat; verpakken nog te doen |
| **Getest tegen PostgreSQL** | Alles is tot nu toe tegen SQLite getest; zie B12 |
| **Migraties aanmaken** | De voorziening staat klaar; de eerste migratie moet nog gegenereerd worden |
| **Echte productgegevens** | Er staat nog geen enkel echt product in de database |

---

## 5. Wat er nu komt

1. **Materialen**: koppeling van materialen aan producten met een hoeveelheid per gast, een
   berekening in de motor, en een zelfstandige materialenlijst. *Dit wil de klant expliciet in v1.*
2. **Allergenen vastleggen bij bevestiging**, plus de waarschuwing bij een product zonder recept en
   zonder allergenen. *Veiligheid — dit raakt de allergenenlijst, het gevoeligste document.*
3. **De rest van de keten**: order, productie, inkoop en factuur ook vanuit het scherm kunnen
   wegschrijven, met dezelfde knop-aanpak als de offerte.
4. **E-mailverzending** met de PDF als bijlage en het verzendlog tegen het evenement.
5. **Back-up en herstel** inrichten op de server, met een bewezen herstelprocedure.
6. **Uitrollen**, de acceptatietest nogmaals op de server tegen PostgreSQL, en daarna het
   Windows-installatiebestand.

---

## 6. Hoe je het nu zelf bekijkt

```bash
npm install
npm run dev                                  # http://localhost:3000
```

Eerste keer: maak op `/admin` je account aan (rol **Beheerder**), en vul daarna de gegevens:

```bash
npm run seed -w @foodbook/web                # 14 allergenen + btw-tarieven (verplicht)
npm run seed:demo -w @foodbook/web           # optioneel: voorbeeldcatalogus om mee te testen
npm run acceptatietest -w @foodbook/web      # de afgesproken acceptatietest
```

Open daarna **http://localhost:3000/rekenen**.

Zie [INSTALLATIE.md](./INSTALLATIE.md) voor de volledige uitleg, [DEPLOY.md](./DEPLOY.md) voor
uitrollen op een server en [KLANTTEST.md](./KLANTTEST.md) voor het beoordelen van de documenten.

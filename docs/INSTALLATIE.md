# Installatie en testen op je eigen machine

Dit beschrijft hoe je de applicatie zelf start en uitprobeert. Er is **geen Docker, geen
databaseserver en geen internetverbinding nodig** om te beginnen: de applicatie gebruikt dan een
lokaal databasebestand (SQLite).

---

## 1. Eenmalig klaarzetten

Vereist: **Node.js 20 of hoger** ([nodejs.org](https://nodejs.org), kies de LTS-versie).

Open een terminal in de projectmap en voer uit:

```bash
npm install
```

Dat installeert alles wat nodig is. Dit duurt de eerste keer enkele minuten.

## 2. De applicatie starten

```bash
npm run dev
```

Er verschijnt een regel `Local: http://localhost:3000`. Open die link in je browser.

Om te stoppen: `Ctrl+C` in de terminal.

## 3. Je account aanmaken

De eerste keer dat je `/admin` opent, krijg je het scherm **"Welkom"** met de vraag je eerste
gebruiker aan te maken. Vul in:

- **E-mailadres** en **wachtwoord** (je eigen keuze)
- **Naam**
- **Rol**: kies **Beheerder**. Alleen een beheerder mag later gebruikers toevoegen en de
  btw-tarieven en allergenenlijst aanpassen.

Klik op **Aanmaken**. Je bent nu ingelogd in de beheeromgeving.

> Bewaar dit wachtwoord. Er is nog geen wachtwoord-reset per e-mail ingericht.

## 4. De wettelijke referentielijsten vullen

Voer in een **tweede** terminalvenster (laat `npm run dev` draaien) uit:

```bash
npm run seed -w @foodbook/web
```

Dit zet de **14 wettelijke allergenen** en de **btw-tarieven (9% en 21%)** in de database. Dit
hoeft maar één keer; opnieuw draaien is veilig en maakt geen dubbele rijen aan.

## 5. Rondkijken

Ga naar **http://localhost:3000/admin** en klik links door de onderdelen:

| Onderdeel | Wat je er kunt doen |
|---|---|
| **Producten** | Een product aanmaken met categorie, eenheid, hoeveelheid per persoon, prijs, btw-tarief en allergenen |
| **Recepten** | Ingrediënten en hoeveelheden vastleggen voor een basisaantal porties |
| **Ingrediënten** | Inkoopeenheid, inkoopprijs, leverancier en allergenen — de bron van waarheid voor allergenen |
| **Klanten** | Klantgegevens, adressen, notities |
| **Evenementen** | Klant koppelen, datum, aantal gasten, producten en materialen |
| **Foto's** | Uploaden, meerdere tegelijk, herordenen, hoofdfoto kiezen |

Alles is in het Nederlands en je kunt zelf aanmaken, wijzigen en verwijderen — daar is geen
ontwikkelaar voor nodig.

---

## Wat je nu wél en nog niet kunt

### Wel

- De applicatie starten, inloggen en je account aanmaken
- Producten, recepten, ingrediënten, klanten, evenementen en materialen **invoeren en beheren**
- Foto's toevoegen en beheren
- De invoervelden, validatie en rolrechten uitproberen

### Nog niet

- **Een evenement doorrekenen vanuit het scherm.** De rekenmotor werkt en is getest, maar er is
  nog geen knop in de beheeromgeving die hem aanroept. Dit is de eerstvolgende stap.
- **Documenten genereren vanuit het scherm.** De offerte, productielijst, allergenenlijst,
  inkooplijst, paklijst en factuur worden al correct opgebouwd, maar alleen via een script — nog
  niet via een knop in de applicatie.
- **Documenten e-mailen.**
- **Een onderdeel dupliceren** met alle regels erbij.

Zie [KLANTTEST.md](./KLANTTEST.md) voor het beoordelen van de documenten die het systeem al
genereert, en [BESLISSINGEN.md](./BESLISSINGEN.md) voor de gemaakte keuzes.

---

## Technische bijzonderheden

### Database

Zonder `DATABASE_URI` in `apps/web/.env` gebruikt de applicatie **SQLite**: een bestand
`apps/web/foodbook.db`. Alle gegevens staan daarin; dat bestand is tegelijk je back-up — kopieer
het om een momentopname te bewaren.

Wil je tegen **PostgreSQL** draaien (de opzet die in de architectuur staat, en de database waarin
het systeem uiteindelijk bij de klant komt te draaien), zet dan in `apps/web/.env`:

```
DATABASE_URI=postgres://foodbook:foodbook@localhost:5432/foodbook
```

en start de database met `npm run db:up` (vereist Docker Desktop).

Begin je met een lege database, verwijder dan `apps/web/foodbook.db` en start opnieuw.

### Als de applicatie niet start

- **"Port 3000 is already in use"** — er draait nog een oud venster. Sluit het, of start op een
  andere poort: `npm run dev -- -p 3001`.
- **`npm test` of `npm run typecheck` werkt niet** — dan is `NODE_ENV=production` in de omgeving
  gezet, waardoor npm ontwikkelpakketten overslaat. Het meegeleverde `.npmrc` vangt dat op;
  verwijder dat bestand niet.
- **Leeg scherm of foutmelding in de browser** — kijk in het terminalvenster waar `npm run dev`
  draait; daar staat de oorzaak.

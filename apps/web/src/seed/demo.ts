import config from '@payload-config';
import { getPayload } from 'payload';
import type { Payload } from 'payload';

/**
 * Zet een kleine, realistische demo-catalogus in de database, zodat het rekenscherm iets te
 * tonen heeft. Bedoeld om mee te testen — draai dit **niet** op een productieomgeving met
 * echte gegevens.
 *
 * Uitvoeren: npm run seed:demo -w @foodbook/web
 *
 * Alles wordt op natuurlijke sleutel (naam) opgezocht voordat het wordt aangemaakt, dus
 * opnieuw draaien levert geen dubbele rijen op.
 */

/**
 * Record-id zoals Payload die gebruikt: een nummer bij SQLite, een UUID-string bij PostgreSQL.
 * Relations moeten die waarde ongewijzigd krijgen, dus hier bewust niet naar een string omgezet.
 */
type Id = number | string;

async function zoekOfMaak(
  payload: Payload,
  collection: Parameters<Payload['create']>[0]['collection'],
  veld: string,
  waarde: string,
  data: Record<string, unknown>,
): Promise<Id> {
  const bestaand = await payload.find({
    collection,
    where: { [veld]: { equals: waarde } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });

  const eerste = bestaand.docs[0];
  if (eerste !== undefined) return eerste.id;

  const nieuw = await payload.create({
    collection,
    data: data as never,
    overrideAccess: true,
  });
  return nieuw.id;
}

async function seedDemo(): Promise<void> {
  const payload = await getPayload({ config });
  payload.logger.info('Demo-catalogus wordt geplaatst…');

  const allergeen = async (code: string): Promise<Id> => {
    const resultaat = await payload.find({
      collection: 'allergenen',
      where: { wettelijkeCode: { equals: code } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const doc = resultaat.docs[0];
    if (doc === undefined) throw new Error(`Allergeen ${code} ontbreekt. Draai eerst npm run seed.`);
    return doc.id;
  };

  const btwLaag = await zoekOfMaak(payload, 'btw-tarieven', 'naam', 'Laag (9%)', {
    naam: 'Laag (9%)',
    percentage: 9,
    standaard: true,
  });
  const btwHoog = await zoekOfMaak(payload, 'btw-tarieven', 'naam', 'Hoog (21%)', {
    naam: 'Hoog (21%)',
    percentage: 21,
    standaard: false,
  });

  const [vis, melk, gluten, sulfiet] = await Promise.all([
    allergeen('VIS'),
    allergeen('MELK'),
    allergeen('GLUTEN'),
    allergeen('SULFIET'),
  ]);

  const categorie = await zoekOfMaak(payload, 'categorieen', 'naam', 'Hoofdgerecht', {
    naam: 'Hoofdgerecht',
    volgorde: 1,
  });
  const categorieDrank = await zoekOfMaak(payload, 'categorieen', 'naam', 'Drank', {
    naam: 'Drank',
    volgorde: 2,
  });

  const leverancier = await zoekOfMaak(payload, 'leveranciers', 'naam', 'Groothandel Van Dijk', {
    naam: 'Groothandel Van Dijk',
    contactpersoon: 'Dhr. Van Dijk',
    email: 'bestelling@vandijk.example.nl',
  });

  const zalm = await zoekOfMaak(payload, 'ingredienten', 'naam', 'Zalmfilet', {
    naam: 'Zalmfilet',
    inkoopeenheid: 'kg',
    inkoopprijs: 24.5,
    leverancier,
    allergenen: [vis],
  });
  const room = await zoekOfMaak(payload, 'ingredienten', 'naam', 'Slagroom', {
    naam: 'Slagroom',
    inkoopeenheid: 'liter',
    inkoopprijs: 6.8,
    leverancier,
    allergenen: [melk],
  });
  const boter = await zoekOfMaak(payload, 'ingredienten', 'naam', 'Boter', {
    naam: 'Boter',
    inkoopeenheid: 'kg',
    inkoopprijs: 11.2,
    leverancier,
    allergenen: [melk],
  });

  const recept = await zoekOfMaak(payload, 'recepten', 'naam', 'Zalmfilet met roomsaus', {
    naam: 'Zalmfilet met roomsaus',
    basisPorties: 10,
    hoeveelheidPerPersoon: 180,
    eenheid: 'gram',
    keukenstation: 'Warme keuken',
    bereidingswijze: 'Zalm op 52 °C stomen. Roomsaus monteren met koude boter.',
    kooktijdMinuten: 25,
    ingredienten: [
      { ingredient: zalm, hoeveelheid: 1800, eenheid: 'gram' },
      { ingredient: room, hoeveelheid: 300, eenheid: 'ml' },
      { ingredient: boter, hoeveelheid: 100, eenheid: 'gram' },
    ],
  });

  // Materialen eerst: de producten verwijzen ernaar in hun materiaalregels (B14).
  const materiaal = async (naam: string, huurprijs: number): Promise<Id> =>
    zoekOfMaak(payload, 'materialen', 'naam', naam, {
      naam,
      eenheid: 'stuk',
      voorraadBeheerd: true,
      voorraad: 400,
      huurprijs,
    });

  const bord = await materiaal('Dinerbord', 0.65);
  const bestek = await materiaal('Bestekset', 0.45);
  const wijnglas = await materiaal('Wijnglas', 0.35);
  const servet = await materiaal('Servet', 0.08);
  const warmhoudplaat = await materiaal('Warmhoudplaat', 12.5);
  const gnBak = await materiaal('Gastronormbak 1/1', 2.5);

  const zalmProduct = await zoekOfMaak(payload, 'producten', 'naam', 'Zalmfilet met roomsaus', {
    naam: 'Zalmfilet met roomsaus',
    categorie,
    portiesBasis: 1,
    eenheid: 'gram',
    hoeveelheidPerPersoon: 180,
    recept,
    prijsPerPersoon: 19.75,
    btwTarief: btwLaag,
    allergenen: [],
    actief: true,
    // Eén bord en één bestekset per gast, één warmhoudplaat per vijftig gasten.
    materialen: [
      { materiaal: bord, hoeveelheid: 1, perAantalGasten: 1 },
      { materiaal: bestek, hoeveelheid: 1, perAantalGasten: 1 },
      { materiaal: warmhoudplaat, hoeveelheid: 1, perAantalGasten: 50 },
    ],
  });

  // Ingekocht artikel zonder recept: allergenen moeten hier direct getagd worden.
  const stokbrood = await zoekOfMaak(payload, 'producten', 'naam', 'Stokbrood', {
    naam: 'Stokbrood',
    categorie,
    portiesBasis: 1,
    eenheid: 'stuk',
    hoeveelheidPerPersoon: 0.5,
    prijsPerPersoon: 2.25,
    btwTarief: btwLaag,
    allergenen: [gluten, melk],
    actief: true,
    // Twee servetten per gast.
    materialen: [{ materiaal: servet, hoeveelheid: 2, perAantalGasten: 1 }],
  });

  const wijn = await zoekOfMaak(payload, 'producten', 'naam', 'Huiswijn rood', {
    naam: 'Huiswijn rood',
    categorie: categorieDrank,
    portiesBasis: 1,
    eenheid: 'ml',
    hoeveelheidPerPersoon: 250,
    prijsPerPersoon: 5.5,
    btwTarief: btwHoog,
    allergenen: [sulfiet],
    actief: true,
    // Anderhalf glas per gast.
    materialen: [{ materiaal: wijnglas, hoeveelheid: 1.5, perAantalGasten: 1 }],
  });

  const klant = await zoekOfMaak(payload, 'klanten', 'naam', 'De Vries Bedrijfsevenementen B.V.', {
    naam: 'De Vries Bedrijfsevenementen B.V.',
    contactpersoon: 'Mevrouw J. de Vries',
    email: 'evenementen@devries.example.nl',
    telefoon: '020 - 765 43 21',
    btwNummer: 'NL987654321B01',
    adres: { straat: 'Keizersgracht', huisnummer: '250', postcode: '1016 EA', plaats: 'Amsterdam', land: 'Nederland' },
    factuuradres: { straat: 'Postbus', huisnummer: '9412', postcode: '1006 AC', plaats: 'Amsterdam', land: 'Nederland' },
  });

  await zoekOfMaak(payload, 'evenementen', 'titel', 'Jubileumfeest De Vries — 250 gasten', {
    klant,
    titel: 'Jubileumfeest De Vries — 250 gasten',
    datum: '2026-09-19',
    locatie: 'Koepelkerk, Amsterdam',
    aantalGasten: 250,
    status: 'concept',
    producten: [
      { product: zalmProduct },
      { product: stokbrood },
      { product: wijn },
    ],
    materialen: [
      // Handmatige aanvulling: wat je vooraf niet uit het menu kunt afleiden.
      { materiaal: gnBak, aantal: 24 },
      { materiaal: warmhoudplaat, aantal: 1 },
    ],
    notities: 'Allergenenlijst separaat aanleveren bij de locatie.',
  });

  // De bedrijfsinstellingen zijn één record. Zonder deze gegevens blijven de kop en voettekst
  // van elk document leeg, dus ze horen bij een werkende demo. De demo zet ze altijd, zodat de
  // huisstijl van De Krim Texel meegaat.
  await payload.updateGlobal({
    slug: 'bedrijfsinstellingen',
    data: {
      naam: 'De Krim Texel',
      kvkNummer: '12345678',
      btwNummer: 'NL123456789B01',
      iban: 'NL91ABNA0417164300',
      adres: {
        straat: 'Havenweg',
        huisnummer: '12',
        postcode: '1791 AB',
        plaats: 'Den Burg, Texel',
        land: 'Nederland',
      },
      email: 'foodbook@dekrimtexel.example.nl',
      telefoon: '0222 - 123 456',
      primaireKleur: '#2f6564',
      secundaireKleur: '#c5a55a',
      standaardVoettekst:
        'De Krim Texel · Van het eiland. Voor ieder moment. · KVK 12345678 · BTW NL123456789B01',
      betalingstermijnDagen: 30,
      offerteGeldigheidDagen: 30,
      factuurPrefix: 'F',
    },
    overrideAccess: true,
  });
  payload.logger.info('Bedrijfsinstellingen gezet op de huisstijl van De Krim Texel.');

  payload.logger.info('Demo-catalogus geplaatst.');
}

await seedDemo();
process.exit(0);

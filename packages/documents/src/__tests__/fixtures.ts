import type {
  Allergeen,
  Bedrijfsinstellingen,
  Evenement,
  Factuur,
  Ingredient,
  Klant,
  Levering,
  Offerte,
  Picking,
  Product,
  Recept,
} from '@foodbook/shared-types';

export const bedrijf: Bedrijfsinstellingen = {
  naam: 'NDY Catering',
  kvkNummer: '12345678',
  btwNummer: 'NL123456789B01',
  iban: 'NL91ABNA0417164300',
  adres: {
    straat: 'Hoofdstraat',
    huisnummer: '1',
    postcode: '1234 AB',
    plaats: 'Utrecht',
    land: 'Nederland',
  },
  email: 'info@ndy-catering.nl',
  telefoon: '030-1234567',
  primaireKleur: '#1F6F4A',
  secundaireKleur: '#F2C94C',
  standaardVoettekst: 'Betaling binnen 30 dagen na factuurdatum.',
  betalingstermijnDagen: 30,
  offerteGeldigheidDagen: 30,
  factuurPrefix: 'F',
};

export const klant: Klant = {
  id: 'klant-1',
  naam: 'Familie Jansen',
  contactpersoon: 'Mevrouw Jansen',
  email: 'jansen@example.nl',
  telefoon: '06-12345678',
  adres: {
    straat: 'Kerkweg',
    huisnummer: '12',
    postcode: '3511 AB',
    plaats: 'Utrecht',
    land: 'Nederland',
  },
  factuuradres: {
    straat: 'Postbus',
    huisnummer: '99',
    postcode: '3500 AB',
    plaats: 'Utrecht',
    land: 'Nederland',
  },
  btwNummer: 'NL987654321B01',
};

export const allergenen: Allergeen[] = [
  { id: 'all-vis', naam: 'Vis', wettelijkeCode: 'VIS' },
  { id: 'all-melk', naam: 'Melk', wettelijkeCode: 'MELK' },
  { id: 'all-gluten', naam: 'Gluten', wettelijkeCode: 'GLUTEN' },
  { id: 'all-selderij', naam: 'Selderij', wettelijkeCode: 'SELDERIJ' },
];

export const ingredienten: Record<string, Ingredient> = {
  'ing-zalm': {
    id: 'ing-zalm',
    naam: 'Zalmfilet',
    inkoopeenheid: 'kg',
    inkoopprijs: 25,
    leverancier: 'lev-vis',
    allergenen: ['all-vis'],
  },
  'ing-room': {
    id: 'ing-room',
    naam: 'Room',
    inkoopeenheid: 'liter',
    inkoopprijs: 8,
    leverancier: 'lev-groothandel',
    allergenen: ['all-melk'],
  },
};

export const recepten: Record<string, Recept> = {
  'rec-zalm': {
    id: 'rec-zalm',
    naam: 'Zalmfilet met roomsaus',
    basisPorties: 10,
    hoeveelheidPerPersoon: 180,
    eenheid: 'gram',
    keukenstation: 'Warme keuken',
    bereidingswijze: 'Zalm stomen, saus monteren met koude boter.',
    kooktijdMinuten: 25,
    ingredienten: [
      { ingredient: 'ing-zalm', hoeveelheid: 1800, eenheid: 'gram' },
      { ingredient: 'ing-room', hoeveelheid: 300, eenheid: 'ml' },
    ],
  },
};

export const producten: Record<string, Product> = {
  'prod-zalm': {
    id: 'prod-zalm',
    naam: 'Zalmfilet met roomsaus',
    categorie: 'cat-hoofd',
    fotos: [],
    portiesBasis: 1,
    eenheid: 'gram',
    hoeveelheidPerPersoon: 180,
    recept: 'rec-zalm',
    prijsPerPersoon: 18.5,
    btwTarief: 'btw-laag',
    allergenen: [],
    actief: true,
  },
  'prod-aardappel': {
    id: 'prod-aardappel',
    naam: 'Gepofte krielaardappel',
    categorie: 'cat-bijgerecht',
    fotos: [],
    portiesBasis: 1,
    eenheid: 'gram',
    hoeveelheidPerPersoon: 200,
    prijsPerPersoon: 3.75,
    btwTarief: 'btw-laag',
    allergenen: ['all-selderij'],
    actief: true,
  },
  'prod-wijn': {
    id: 'prod-wijn',
    naam: 'Huiswijn rood',
    categorie: 'cat-drank',
    fotos: [],
    portiesBasis: 1,
    eenheid: 'ml',
    hoeveelheidPerPersoon: 150,
    prijsPerPersoon: 4.5,
    btwTarief: 'btw-hoog',
    allergenen: [],
    actief: true,
  },
};

export const evenement: Evenement = {
  id: 'evt-1',
  klant: 'klant-1',
  titel: 'Bruiloft Jansen',
  datum: '2026-06-20',
  aantalGasten: 100,
  status: 'bevestigd',
  producten: [
    { product: 'prod-zalm' },
    { product: 'prod-aardappel' },
    { product: 'prod-wijn' },
  ],
  materialen: [{ materiaal: 'mat-bord', aantal: 100 }],
};

export const offerte: Offerte = {
  id: 'off-1',
  event: 'evt-1',
  versie: 1,
  regels: [
    {
      product: 'prod-zalm',
      productNaam: 'Zalmfilet met roomsaus',
      aantalGasten: 100,
      hoeveelheidPerPersoon: 180,
      eenheid: 'gram',
      prijsPerPersoon: 18.5,
      btwTarief: 'btw-laag',
      btwPercentage: 9,
      regelTotaalExcl: 1850,
      btwBedrag: 166.5,
      regelTotaalIncl: 2016.5,
    },
    {
      product: 'prod-aardappel',
      productNaam: 'Gepofte krielaardappel',
      aantalGasten: 100,
      hoeveelheidPerPersoon: 200,
      eenheid: 'gram',
      prijsPerPersoon: 3.75,
      btwTarief: 'btw-laag',
      btwPercentage: 9,
      regelTotaalExcl: 375,
      btwBedrag: 33.75,
      regelTotaalIncl: 408.75,
    },
    {
      product: 'prod-wijn',
      productNaam: 'Huiswijn rood',
      aantalGasten: 100,
      hoeveelheidPerPersoon: 150,
      eenheid: 'ml',
      prijsPerPersoon: 4.5,
      btwTarief: 'btw-hoog',
      btwPercentage: 21,
      regelTotaalExcl: 450,
      btwBedrag: 94.5,
      regelTotaalIncl: 544.5,
    },
  ],
  btwUitsplitsing: [
    { btwTarief: 'btw-laag', naam: 'Laag (9%)', percentage: 9, grondslag: 2225, btwBedrag: 200.25 },
    { btwTarief: 'btw-hoog', naam: 'Hoog (21%)', percentage: 21, grondslag: 450, btwBedrag: 94.5 },
  ],
  subtotaal: 2675,
  btwTotaal: 294.75,
  totaal: 2969.75,
  status: 'verzonden',
  geldigTot: '2026-07-20',
};

export const factuur: Factuur = {
  id: 'fact-1',
  order: 'ord-1',
  factuurnummer: 'F2026-0001',
  factuurdatum: '2026-06-25',
  vervaldatum: '2026-07-25',
  regels: [
    {
      omschrijving: 'Zalmfilet met roomsaus — 100 gasten à 18.5',
      aantal: 100,
      eenheidsprijs: 18.5,
      btwTarief: 'btw-laag',
      btwPercentage: 9,
      regelTotaalExcl: 1850,
      btwBedrag: 166.5,
      regelTotaalIncl: 2016.5,
    },
  ],
  btwUitsplitsing: [
    { btwTarief: 'btw-laag', naam: 'Laag (9%)', percentage: 9, grondslag: 1850, btwBedrag: 166.5 },
  ],
  subtotaal: 1850,
  btwTotaal: 166.5,
  totaal: 2016.5,
  status: 'verzonden',
};

export const picking: Picking = {
  order: 'ord-1',
  status: 'open',
  regels: [
    {
      soort: 'voedsel',
      referentie: 'prod-zalm',
      omschrijving: 'Zalmfilet met roomsaus',
      hoeveelheid: 18000,
      eenheid: 'gram',
      afgevinkt: true,
    },
    {
      soort: 'materiaal',
      referentie: 'mat-bord',
      omschrijving: 'Dinerbord',
      hoeveelheid: 100,
      eenheid: 'stuk',
      afgevinkt: false,
    },
  ],
};

export const levering: Levering = {
  id: 'lev-1',
  order: 'ord-1',
  leverdatum: '2026-06-20',
  levertijd: '16:30',
  verantwoordelijke: 'Piet',
  status: 'gepland',
};

export const inkoop = {
  periodeVan: '2026-06-01',
  periodeTot: '2026-06-30',
  regels: [
    {
      ingredient: 'ing-zalm',
      naam: 'Zalmfilet',
      hoeveelheid: 3,
      inkoopEenheid: 'kg' as const,
      eenheidsprijs: 25,
      kostprijs: 75,
      leverancier: 'lev-vis',
      leverancierNaam: 'Vishandel De Golf',
      herkomst: ['evt-1'],
    },
  ],
};

/**
 * Genereert voorbeelddocumenten voor het acceptatiescenario uit de klantvraag:
 * één evenement van 250 gasten, helemaal door de rekenmotor, met de belangrijkste
 * documenten als HTML en PDF.
 *
 * Dit is tegelijk een demo en een rooktest van de hele keten: het script gebruikt exact
 * dezelfde pakketten als de applicatie, zonder database.
 *
 * Uitvoeren:  npx tsx scripts/genereer-voorbeelddocumenten.mts
 * Uitvoer:    voorbeelddocumenten/
 */

import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import puppeteer from 'puppeteer-core';

import {
  aggregeerInkoop,
  berekenEvenementProductie,
  berekenMaterialen,
  bepaalVolgendFactuurNummer,
  maakFactuurSnapshot,
  maakOfferteSnapshot,
  maakPaklijst,
  type EvenementProductie,
} from '@foodbook/calculation-engine';
import {
  maakAllergenenlijstDocument,
  maakFactuurDocument,
  maakInkooplijstDocument,
  maakMaterialenlijstDocument,
  maakOfferteDocument,
  maakPaklijstDocument,
  maakProductielijstDocument,
  type DocumentModel,
} from '@foodbook/documents';
import { naarHtmlDocument } from '@foodbook/documents/templates/html';
import type {
  Allergeen,
  Bedrijfsinstellingen,
  BtwTarief,
  Evenement,
  Ingredient,
  Klant,
  Materiaal,
  Product,
  Recept,
} from '@foodbook/shared-types';

const UIT = resolve(process.cwd(), 'voorbeelddocumenten');

// ─────────────────────────────────────────────────────────────────────────────
// Browsers: de systeem-Edge van Windows, zodat er geen Chromium meegebundeld hoeft.
// ─────────────────────────────────────────────────────────────────────────────

const BROWSERKANDIDATEN = [
  process.env.CHROME_PAD,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].filter((pad): pad is string => typeof pad === 'string');

// ─────────────────────────────────────────────────────────────────────────────
// Stamdata
// ─────────────────────────────────────────────────────────────────────────────

const bedrijf: Bedrijfsinstellingen = {
  naam: 'NDY Catering',
  kvkNummer: '12345678',
  btwNummer: 'NL123456789B01',
  iban: 'NL91ABNA0417164300',
  adres: { straat: 'Hoofdstraat', huisnummer: '1', postcode: '1234 AB', plaats: 'Utrecht', land: 'Nederland' },
  email: 'administratie@ndy-catering.nl',
  telefoon: '030 - 123 45 67',
  primaireKleur: '#1f6f4a',
  secundaireKleur: '#f2c94c',
  standaardVoettekst: 'NDY Catering · KVK 12345678 · BTW NL123456789B01 · IBAN NL91ABNA0417164300',
  betalingstermijnDagen: 30,
  offerteGeldigheidDagen: 30,
  factuurPrefix: 'F',
};

const klant: Klant = {
  id: 'klant-1',
  naam: 'De Vries Bedrijfsevenementen B.V.',
  contactpersoon: 'Mevrouw J. de Vries',
  email: 'evenementen@devries.example.nl',
  telefoon: '020 - 765 43 21',
  adres: { straat: 'Keizersgracht', huisnummer: '250', postcode: '1016 EA', plaats: 'Amsterdam', land: 'Nederland' },
  factuuradres: { straat: 'Postbus', huisnummer: '9412', postcode: '1006 AC', plaats: 'Amsterdam', land: 'Nederland' },
  btwNummer: 'NL987654321B01',
};

const allergenen: Allergeen[] = [
  { id: 'all-gluten', naam: 'Glutenbevattende granen', wettelijkeCode: 'GLUTEN' },
  { id: 'all-schaaldieren', naam: 'Schaaldieren', wettelijkeCode: 'SCHAALDIEREN' },
  { id: 'all-ei', naam: 'Eieren', wettelijkeCode: 'EI' },
  { id: 'all-vis', naam: 'Vis', wettelijkeCode: 'VIS' },
  { id: 'all-noten', naam: 'Noten', wettelijkeCode: 'NOTEN' },
  { id: 'all-melk', naam: 'Melk', wettelijkeCode: 'MELK' },
  { id: 'all-selderij', naam: 'Selderij', wettelijkeCode: 'SELDERIJ' },
  { id: 'all-mosterd', naam: 'Mosterd', wettelijkeCode: 'MOSTERD' },
  { id: 'all-sesam', naam: 'Sesamzaad', wettelijkeCode: 'SESAMZAAD' },
  { id: 'all-sulfiet', naam: 'Zwaveldioxide en sulfieten', wettelijkeCode: 'SULFIET' },
];

const btwTarieven: BtwTarief[] = [
  { id: 'btw-laag', naam: 'Laag (9%)', percentage: 9, standaard: true },
  { id: 'btw-hoog', naam: 'Hoog (21%)', percentage: 21, standaard: false },
];

const ingredienten: Ingredient[] = [
  { id: 'ing-zalm', naam: 'Zalmfilet', inkoopeenheid: 'kg', inkoopprijs: 24.5, leverancier: 'lev-vis', allergenen: ['all-vis'] },
  { id: 'ing-room', naam: 'Slagroom', inkoopeenheid: 'liter', inkoopprijs: 6.8, leverancier: 'lev-groothandel', allergenen: ['all-melk'] },
  { id: 'ing-boter', naam: 'Boter', inkoopeenheid: 'kg', inkoopprijs: 11.2, leverancier: 'lev-groothandel', allergenen: ['all-melk'] },
  { id: 'ing-citroen', naam: 'Citroen', inkoopeenheid: 'stuk', inkoopprijs: 0.75, leverancier: 'lev-groothandel', allergenen: [] },
  { id: 'ing-aardappel', naam: 'Krielaardappel', inkoopeenheid: 'kg', inkoopprijs: 2.1, leverancier: 'lev-groothandel', allergenen: [] },
  { id: 'ing-asperge', naam: 'Groene asperge', inkoopeenheid: 'kg', inkoopprijs: 9.4, leverancier: 'lev-groothandel', allergenen: [] },
  { id: 'ing-parmaham', naam: 'Parmaham', inkoopeenheid: 'kg', inkoopprijs: 28, leverancier: 'lev-vis', allergenen: [] },
  { id: 'ing-meloen', naam: 'Cantaloupemeloen', inkoopeenheid: 'stuk', inkoopprijs: 3.2, leverancier: 'lev-groothandel', allergenen: [] },
  { id: 'ing-brie', naam: 'Brie', inkoopeenheid: 'kg', inkoopprijs: 14.5, leverancier: 'lev-groothandel', allergenen: ['all-melk'] },
  { id: 'ing-walnoot', naam: 'Walnoot', inkoopeenheid: 'kg', inkoopprijs: 19, leverancier: 'lev-groothandel', allergenen: ['all-noten'] },
  { id: 'ing-honing', naam: 'Honing', inkoopeenheid: 'kg', inkoopprijs: 12, leverancier: 'lev-groothandel', allergenen: [] },
  { id: 'ing-stokbrood', naam: 'Stokbrood', inkoopeenheid: 'stuk', inkoopprijs: 1.35, leverancier: 'lev-bakker', allergenen: ['all-gluten'] },
  { id: 'ing-roomijs', naam: 'Vanille-roomijs', inkoopeenheid: 'liter', inkoopprijs: 7.9, leverancier: 'lev-groothandel', allergenen: ['all-melk', 'all-ei'] },
  { id: 'ing-framboos', naam: 'Framboos', inkoopeenheid: 'kg', inkoopprijs: 16, leverancier: 'lev-groothandel', allergenen: [] },
  { id: 'ing-koffie', naam: 'Koffiebonen', inkoopeenheid: 'kg', inkoopprijs: 18, leverancier: 'lev-groothandel', allergenen: [] },
  { id: 'ing-wijn', naam: 'Huiswijn rood', inkoopeenheid: 'liter', inkoopprijs: 6.5, leverancier: 'lev-groothandel', allergenen: ['all-sulfiet'] },
];

const recepten: Recept[] = [
  {
    id: 'rec-zalm',
    naam: 'Zalmfilet met roomsaus',
    basisPorties: 10,
    hoeveelheidPerPersoon: 180,
    eenheid: 'gram',
    keukenstation: 'Warme keuken',
    bereidingswijze: 'Zalm op 52 °C stomen. Roomsaus monteren met koude boter, op smaak met citroen.',
    kooktijdMinuten: 25,
    ingredienten: [
      { ingredient: 'ing-zalm', hoeveelheid: 1800, eenheid: 'gram' },
      { ingredient: 'ing-room', hoeveelheid: 300, eenheid: 'ml' },
      { ingredient: 'ing-boter', hoeveelheid: 100, eenheid: 'gram' },
      { ingredient: 'ing-citroen', hoeveelheid: 2, eenheid: 'stuk' },
    ],
  },
  {
    id: 'rec-asperge',
    naam: 'Groene asperges met citroenboter',
    basisPorties: 10,
    hoeveelheidPerPersoon: 120,
    eenheid: 'gram',
    keukenstation: 'Warme keuken',
    bereidingswijze: 'Asperges kort blancheren, afmaken in citroenboter.',
    kooktijdMinuten: 12,
    ingredienten: [
      { ingredient: 'ing-asperge', hoeveelheid: 1200, eenheid: 'gram' },
      { ingredient: 'ing-boter', hoeveelheid: 80, eenheid: 'gram' },
      { ingredient: 'ing-citroen', hoeveelheid: 1, eenheid: 'stuk' },
    ],
  },
  {
    id: 'rec-amuse',
    naam: 'Parmaham met meloen',
    basisPorties: 10,
    hoeveelheidPerPersoon: 90,
    eenheid: 'gram',
    keukenstation: 'Koude keuken',
    bereidingswijze: 'Parmaham dunnen plakken snijden, meloen in blokjes, op prikker serveren.',
    kooktijdMinuten: 20,
    ingredienten: [
      { ingredient: 'ing-parmaham', hoeveelheid: 600, eenheid: 'gram' },
      { ingredient: 'ing-meloen', hoeveelheid: 2, eenheid: 'stuk' },
    ],
  },
  {
    id: 'rec-dessert',
    naam: 'Roomijs met framboos',
    basisPorties: 10,
    hoeveelheidPerPersoon: 100,
    eenheid: 'gram',
    keukenstation: 'Koude keuken',
    bereidingswijze: 'Bollen draaien, framboos erover, direct serveren.',
    kooktijdMinuten: 5,
    ingredienten: [
      { ingredient: 'ing-roomijs', hoeveelheid: 700, eenheid: 'ml' },
      { ingredient: 'ing-framboos', hoeveelheid: 300, eenheid: 'gram' },
    ],
  },
];

const producten: Product[] = [
  {
    id: 'prod-zalm', naam: 'Zalmfilet met roomsaus', categorie: 'cat-hoofd', fotos: [], portiesBasis: 1,
    eenheid: 'gram', hoeveelheidPerPersoon: 180, recept: 'rec-zalm', prijsPerPersoon: 19.75,
    btwTarief: 'btw-laag', allergenen: [], actief: true,
    // B14 — materiaal per gast. Dit rekent automatisch mee met het gastenaantal.
    materialen: [
      { materiaal: 'mat-bord', hoeveelheid: 1, perAantalGasten: 1 },
      { materiaal: 'mat-bestek', hoeveelheid: 1, perAantalGasten: 1 },
      { materiaal: 'mat-warmhoudplaat', hoeveelheid: 1, perAantalGasten: 50 },
    ],
  },
  {
    id: 'prod-asperge', naam: 'Groene asperges met citroenboter', categorie: 'cat-bijgerecht', fotos: [], portiesBasis: 1,
    eenheid: 'gram', hoeveelheidPerPersoon: 120, recept: 'rec-asperge', prijsPerPersoon: 6.5,
    btwTarief: 'btw-laag', allergenen: [], actief: true,
  },
  {
    id: 'prod-aardappel', naam: 'Gepofte krielaardappel', categorie: 'cat-bijgerecht', fotos: [], portiesBasis: 1,
    eenheid: 'gram', hoeveelheidPerPersoon: 200, prijsPerPersoon: 4.25,
    btwTarief: 'btw-laag', allergenen: [], actief: true,
  },
  {
    id: 'prod-amuse', naam: 'Parmaham met meloen', categorie: 'cat-voorgerecht', fotos: [], portiesBasis: 1,
    eenheid: 'gram', hoeveelheidPerPersoon: 90, recept: 'rec-amuse', prijsPerPersoon: 7.95,
    btwTarief: 'btw-laag', allergenen: [], actief: true,
  },
  {
    id: 'prod-dessert', naam: 'Roomijs met framboos', categorie: 'cat-nagerecht', fotos: [], portiesBasis: 1,
    eenheid: 'gram', hoeveelheidPerPersoon: 100, recept: 'rec-dessert', prijsPerPersoon: 5.75,
    btwTarief: 'btw-laag', allergenen: [], actief: true,
    materialen: [{ materiaal: 'mat-servet', hoeveelheid: 2, perAantalGasten: 1 }],
  },
  {
    id: 'prod-brood', naam: 'Stokbrood met kruidenboter', categorie: 'cat-bijgerecht', fotos: [], portiesBasis: 1,
    eenheid: 'stuk', hoeveelheidPerPersoon: 0.5, prijsPerPersoon: 2.25,
    btwTarief: 'btw-laag',
    // Ingekocht artikel zonder recept: allergenen moeten hier direct getagd worden.
    allergenen: ['all-gluten', 'all-melk'],
    actief: true,
  },
  {
    id: 'prod-wijn', naam: 'Huiswijn rood', categorie: 'cat-drank', fotos: [], portiesBasis: 1,
    eenheid: 'ml', hoeveelheidPerPersoon: 250, prijsPerPersoon: 5.5,
    btwTarief: 'btw-hoog',
    // Ingekocht artikel: sulfiet zit in de wijn zelf, niet in een receptregel.
    allergenen: ['all-sulfiet'],
    actief: true,
    materialen: [{ materiaal: 'mat-wijnglas', hoeveelheid: 1.2, perAantalGasten: 1 }],
  },
  {
    id: 'prod-koffie', naam: 'Koffie en thee', categorie: 'cat-drank', fotos: [], portiesBasis: 1,
    eenheid: 'ml', hoeveelheidPerPersoon: 200, prijsPerPersoon: 3.25,
    btwTarief: 'btw-laag', allergenen: [], actief: true,
  },
];

const evenement: Evenement = {
  id: 'evt-250',
  klant: klant.id,
  titel: 'Jubileumfeest De Vries — 250 gasten',
  datum: '2026-09-19',
  locatie: 'Koepelkerk, Amsterdam',
  aantalGasten: 250,
  status: 'bevestigd',
  producten: producten.map((product) => ({ product: product.id })),
  materialen: [
    // Handmatige aanvulling: wat je vooraf niet uit het menu kunt afleiden.
    { materiaal: 'mat-gn-bak', aantal: 24 },
    { materiaal: 'mat-warmhoudplaat', aantal: 1 },
  ],
  notities: 'Allergenenlijst separaat aanleveren bij de locatie. Opbouw vanaf 14:00.',
};

const materialen: Materiaal[] = [
  { id: 'mat-bord', naam: 'Dinerbord', eenheid: 'stuk', voorraadBeheerd: true, voorraad: 400, huurprijs: 0.65 },
  { id: 'mat-bestek', naam: 'Bestekset', eenheid: 'stuk', voorraadBeheerd: true, voorraad: 400, huurprijs: 0.45 },
  { id: 'mat-wijnglas', naam: 'Wijnglas', eenheid: 'stuk', voorraadBeheerd: true, voorraad: 500, huurprijs: 0.35 },
  { id: 'mat-servet', naam: 'Servet', eenheid: 'stuk', voorraadBeheerd: false, huurprijs: 0.08 },
  { id: 'mat-gn-bak', naam: 'Gastronormbak 1/1', eenheid: 'stuk', voorraadBeheerd: true, voorraad: 60, huurprijs: 2.5 },
  { id: 'mat-warmhoudplaat', naam: 'Warmhoudplaat', eenheid: 'stuk', voorraadBeheerd: true, voorraad: 10, huurprijs: 12.5 },
];

// ─────────────────────────────────────────────────────────────────────────────
// Rekenen
// ─────────────────────────────────────────────────────────────────────────────

const productenMap = Object.fromEntries(producten.map((product) => [product.id, product]));
const receptenMap = Object.fromEntries(recepten.map((recept) => [recept.id, recept]));
const ingredientenMap = Object.fromEntries(ingredienten.map((ingredient) => [ingredient.id, ingredient]));
const btwMap = Object.fromEntries(btwTarieven.map((tarief) => [tarief.id, tarief]));
const materialenMap = Object.fromEntries(materialen.map((materiaal) => [materiaal.id, materiaal]));

const productie: EvenementProductie = berekenEvenementProductie(evenement, productenMap, {
  recepten: receptenMap,
  ingredienten: ingredientenMap,
});

const offerte = {
  ...maakOfferteSnapshot(evenement, productenMap, receptenMap, btwMap, {
    versie: 1,
    geldigTot: '2026-10-19',
  }),
  id: 'off-1',
};

const inkoop = aggregeerInkoop([productie], ingredientenMap, {}, {
  periodeVan: '2026-09-14',
  periodeTot: '2026-09-20',
  houdVoorraadAf: false,
});

// B14 — materiaalbehoefte: automatisch uit de gerechten, plus de handmatige regels van het
// evenement. Dit is wat er op de zelfstandige materialenlijst komt.
const materiaalBehoefte = berekenMaterialen(evenement, productenMap, materialenMap);

const paklijst = maakPaklijst(productie, materiaalBehoefte);

const factuurSnapshot = maakFactuurSnapshot(
  { ...offerte, status: 'geaccepteerd' },
  btwMap,
  {
    order: 'ord-1',
    factuurnummer: bepaalVolgendFactuurNummer([], { prefix: bedrijf.factuurPrefix, jaar: 2026 }),
    factuurdatum: '2026-09-21',
    betalingstermijnDagen: bedrijf.betalingstermijnDagen,
  },
);

const documenten: DocumentModel[] = [
  maakOfferteDocument(offerte, evenement, klant, bedrijf),
  maakProductielijstDocument(productie, evenement, bedrijf),
  maakAllergenenlijstDocument({
    evenement,
    producten: productenMap,
    recepten: receptenMap,
    ingredienten: ingredientenMap,
    allergenen,
    klant,
    bedrijf,
  }),
  maakInkooplijstDocument(inkoop, bedrijf),
  maakMaterialenlijstDocument({ evenement, materialen: materiaalBehoefte, klant, bedrijf }),
  maakPaklijstDocument(paklijst, evenement, klant, bedrijf),
  maakFactuurDocument({ ...factuurSnapshot, id: 'fact-1' }, klant, bedrijf),
];

// ─────────────────────────────────────────────────────────────────────────────
// Wegschrijven
// ─────────────────────────────────────────────────────────────────────────────

mkdirSync(UIT, { recursive: true });

const browserPad = BROWSERKANDIDATEN.find((pad) => existsSync(pad));

const htmlBestanden = documenten.map((document) => {
  const html = naarHtmlDocument(document, bedrijf);
  const bestand = `${UIT}\\${document.bestandsnaam}.html`;
  writeFileSync(bestand, html, 'utf8');
  return { document, html, bestand };
});

async function maakPdfs(): Promise<string[]> {
  if (browserPad === undefined) {
    console.log('  ! Geen Edge of Chrome gevonden; PDF’s overgeslagen.');
    return [];
  }

  const browser = await puppeteer.launch({
    executablePath: browserPad,
    headless: true,
    args: ['--no-sandbox', '--disable-gpu'],
  });

  const paden: string[] = [];
  try {
    for (const { html, document } of htmlBestanden) {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'load' });
      const pad = `${UIT}\\${document.bestandsnaam}.pdf`;
      await page.pdf({ path: pad, printBackground: true, preferCSSPageSize: true });
      await page.close();
      paden.push(pad);
    }
  } finally {
    await browser.close();
  }

  return paden;
}

const pdfPaden = await maakPdfs();

// ─────────────────────────────────────────────────────────────────────────────
// Rapport
// ─────────────────────────────────────────────────────────────────────────────

const euro = (bedrag: number) =>
  new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(bedrag);
const getal = (waarde: number) => new Intl.NumberFormat('nl-NL', { maximumFractionDigits: 3 }).format(waarde);

console.log('\n=== Evenement ===');
console.log(`  ${evenement.titel}`);
console.log(`  ${evenement.aantalGasten} gasten · ${evenement.producten.length} producten · ${evenement.materialen.length} materiaalsoorten`);

console.log('\n=== Ingrediëntbehoefte (exact, uit de rekenmotor) ===');
for (const regel of productie.ingredientTotalen) {
  console.log(`  ${regel.naam.padEnd(24)} ${getal(regel.hoeveelheid).padStart(10)} ${regel.basisEenheid}`);
}

console.log('\n=== Inkoop (afgerond op inkoopeenheid) ===');
let inkoopTotaal = 0;
for (const regel of inkoop.regels) {
  inkoopTotaal += regel.kostprijs;
  console.log(`  ${regel.naam.padEnd(24)} ${getal(regel.hoeveelheid).padStart(8)} ${regel.inkoopEenheid.padEnd(6)} ${euro(regel.kostprijs).padStart(12)}`);
}
console.log(`  ${'—'.repeat(52)}`);
console.log(`  ${'Inkoopkostprijs'.padEnd(24)} ${' '.repeat(15)} ${euro(inkoopTotaal).padStart(12)}`);

console.log('\n=== Offerte ===');
for (const regel of offerte.regels) {
  console.log(`  ${regel.productNaam.padEnd(36)} ${String(regel.aantalGasten).padStart(4)} × ${euro(regel.prijsPerPersoon).padStart(9)} = ${euro(regel.regelTotaalExcl).padStart(12)}`);
}
console.log(`  ${'Subtotaal'.padEnd(36)} ${euro(offerte.subtotaal).padStart(28)}`);
for (const regel of offerte.btwUitsplitsing) {
  console.log(`  ${`Btw ${regel.percentage}%`.padEnd(36)} ${euro(regel.btwBedrag).padStart(28)}`);
}
console.log(`  ${'TOTAAL'.padEnd(36)} ${euro(offerte.totaal).padStart(28)}`);

console.log('\n=== Kostprijs vs. omzet (marge, niet automatisch gelijkgesteld — §4.2) ===');
const kostprijsServeren = productie.regels.reduce((som, regel) => som + regel.kostprijs, 0);
console.log(`  Verkoop excl. btw ${euro(offerte.subtotaal)}`);
console.log(`  Inkoopkostprijs  ${euro(kostprijsServeren)}`);
console.log(`  Brutomarge       ${euro(offerte.subtotaal - kostprijsServeren)}`);

console.log('\n=== Materialen (B14) — automatisch per gast plus handmatig ===');
for (const regel of materiaalBehoefte) {
  const herkomst = regel.herkomst.length > 0 ? regel.herkomst.join(', ') : 'handmatig';
  console.log(
    `  ${regel.naam.padEnd(22)} ${getal(regel.totaal).padStart(8)} ${regel.eenheid.padEnd(6)} ` +
      `(auto ${getal(regel.automatisch).padStart(6)}, handmatig ${getal(regel.handmatig).padStart(5)})  ${herkomst}`,
  );
}

console.log('\n=== Factuur ===');
console.log(`  ${factuurSnapshot.factuurnummer} · factuurdatum ${factuurSnapshot.factuurdatum} · vervalt ${factuurSnapshot.vervaldatum}`);
console.log(`  Btw per tarief: ${factuurSnapshot.btwUitsplitsing.map((regel) => `${regel.percentage}% over ${euro(regel.grondslag)}`).join(', ')}`);
console.log(`  Totaal ${euro(factuurSnapshot.totaal)}`);

console.log('\n=== Paklijst ===');
console.log(`  ${paklijst.regels.filter((regel) => regel.soort === 'voedsel').length} voedselregels + ${paklijst.regels.filter((regel) => regel.soort === 'materiaal').length} materiaalregels`);

console.log('\n=== Gegenereerde documenten ===');
for (const { bestand, document } of htmlBestanden) {
  console.log(`  ${document.type.padEnd(18)} ${bestand}`);
}
for (const pad of pdfPaden) {
  console.log(`  ${'PDF'.padEnd(18)} ${pad}`);
}
console.log(`\nKlaar: ${htmlBestanden.length} HTML + ${pdfPaden.length} PDF in ${UIT}\n`);

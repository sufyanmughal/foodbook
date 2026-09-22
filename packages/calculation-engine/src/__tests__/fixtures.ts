import type {
  Allergeen,
  BtwTarief,
  Evenement,
  Ingredient,
  Leverancier,
  Materiaal,
  Product,
  Recept,
} from '@foodbook/shared-types';
import { indexeer } from '@foodbook/shared-types';

/**
 * Testdataset die de scenario's uit ARCHITECTURE.md §4 dekt:
 * een product mét recept, een product zonder recept, en een tweede btw-tarief.
 */

export const allergenen: Allergeen[] = [
  { id: 'all-vis', naam: 'Vis', wettelijkeCode: 'VIS' },
  { id: 'all-melk', naam: 'Melk', wettelijkeCode: 'MELK' },
  { id: 'all-gluten', naam: 'Gluten', wettelijkeCode: 'GLUTEN' },
  { id: 'all-selderij', naam: 'Selderij', wettelijkeCode: 'SELDERIJ' },
];

export const btwTarieven: BtwTarief[] = [
  { id: 'btw-laag', naam: 'Laag (9%)', percentage: 9, standaard: true },
  { id: 'btw-hoog', naam: 'Hoog (21%)', percentage: 21, standaard: false },
];

export const leveranciers: Leverancier[] = [
  { id: 'lev-vis', naam: 'Vishandel De Golf' },
  { id: 'lev-groothandel', naam: 'Groothandel Van Dijk' },
];

export const ingredienten: Ingredient[] = [
  {
    id: 'ing-zalm',
    naam: 'Zalmfilet',
    inkoopeenheid: 'kg',
    inkoopprijs: 25,
    leverancier: 'lev-vis',
    allergenen: ['all-vis'],
  },
  {
    id: 'ing-room',
    naam: 'Room',
    inkoopeenheid: 'liter',
    inkoopprijs: 8,
    leverancier: 'lev-groothandel',
    allergenen: ['all-melk'],
  },
  {
    id: 'ing-boter',
    naam: 'Boter',
    inkoopeenheid: 'kg',
    inkoopprijs: 12,
    leverancier: 'lev-groothandel',
    allergenen: ['all-melk'],
  },
  {
    id: 'ing-citroen',
    naam: 'Citroen',
    inkoopeenheid: 'stuk',
    inkoopprijs: 0.8,
    leverancier: 'lev-groothandel',
    allergenen: [],
  },
  {
    id: 'ing-aardappel',
    naam: 'Krielaardappel',
    inkoopeenheid: 'kg',
    inkoopprijs: 2,
    leverancier: 'lev-groothandel',
    allergenen: [],
  },
];

export const recepten: Recept[] = [
  {
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
      { ingredient: 'ing-boter', hoeveelheid: 100, eenheid: 'gram' },
      { ingredient: 'ing-citroen', hoeveelheid: 2, eenheid: 'stuk' },
    ],
  },
];

export const producten: Product[] = [
  {
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
  {
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
  {
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
];

export function maakEvenement(overschrijf: Partial<Evenement> = {}): Evenement {
  return {
    id: 'evt-1',
    klant: 'klant-1',
    titel: 'Bruiloft Jansen',
    datum: '2026-06-20',
    aantalGasten: 100,
    status: 'concept',
    producten: [
      { product: 'prod-zalm' },
      { product: 'prod-aardappel' },
      { product: 'prod-wijn' },
    ],
    materialen: [{ materiaal: 'mat-bord', aantal: 100 }],
    ...overschrijf,
  };
}

export const materialen: Materiaal[] = [
  {
    id: 'mat-bord',
    naam: 'Dinerbord',
    eenheid: 'stuk',
    voorraadBeheerd: true,
    voorraad: 200,
    huurprijs: 0.5,
  },
];

export const lookup = {
  allergenen: indexeer(allergenen),
  btwTarieven: indexeer(btwTarieven),
  leveranciers: indexeer(leveranciers),
  ingredienten: indexeer(ingredienten),
  recepten: indexeer(recepten),
  producten: indexeer(producten),
  materialen: indexeer(materialen),
};

import type { PictogramNaam } from './Pictogram';

/**
 * De navigatie van de beheeromgeving.
 *
 * De indeling volgt het aangeleverde ontwerp. Elke regel wijst naar een bestaande bestemming:
 * een eigen scherm of een collectie in de beheeromgeving. Onderdelen die in het ontwerp staan
 * maar nog niet gebouwd zijn, staan er wel bij maar zonder link — met het etiket "volgt", zodat
 * zichtbaar is dat ze op de planning staan en er geen dode link ontstaat.
 */

export interface NavItem {
  label: string;
  href?: string;
  /** Korte omschrijving; gebruikt als toegankelijke toelichting. */
  toelichting: string;
  /**
   * Hoe het pictogram eruitziet. Verwijst naar de gedeelde pictogrammenset, zodat een niet-
   * bestaand icoon meteen een compileerfout geeft in plaats van een leeg vakje in de zijbalk.
   */
  icoon: PictogramNaam;
}

export interface NavGroep {
  titel: string;
  items: NavItem[];
}

export const NAVIGATIE: NavGroep[] = [
  {
    titel: 'Work',
    items: [
      {
        label: 'Dashboard',
        href: '/rekenen',
        toelichting: 'Cost events and produce documents',
        icoon: 'bord',
      },
      {
        label: 'Foodbook',
        href: '/',
        toelichting: 'The presentation with photos and dishes',
        icoon: 'boek',
      },
    ],
  },
  {
    titel: 'Catalogue',
    items: [
      {
        label: 'Products',
        href: '/admin/collections/producten',
        toelichting: 'Dishes with price, unit and photos',
        icoon: 'pan',
      },
      {
        label: 'Recipes',
        href: '/admin/collections/recepten',
        toelichting: 'Recipes with ingredients and method',
        icoon: 'recept',
      },
      {
        label: 'Ingredients',
        href: '/admin/collections/ingredienten',
        toelichting: 'Purchase prices and allergens per ingredient',
        icoon: 'mand',
      },
      {
        label: 'Suppliers',
        href: '/admin/collections/leveranciers',
        toelichting: 'Where the ingredients come from',
        icoon: 'wagen',
      },
      {
        label: 'Materials',
        href: '/admin/collections/materialen',
        toelichting: 'Plates, cutlery, gastronorm and warming',
        icoon: 'doos',
      },
      {
        label: 'Allergens & diet',
        href: '/admin/collections/allergenen',
        toelichting: 'The fourteen regulated allergens',
        icoon: 'allergeen',
      },
    ],
  },
  {
    titel: 'Operations',
    items: [
      {
        label: 'Customers',
        href: '/admin/collections/klanten',
        toelichting: 'Contact details and history',
        icoon: 'klant',
      },
      {
        label: 'Events',
        href: '/admin/collections/evenementen',
        toelichting: 'Guests, date, products and materials',
        icoon: 'agenda',
      },
      {
        label: 'Calculations',
        href: '/rekenen',
        toelichting: 'Cost events and generate quotations',
        icoon: 'rekenmachine',
      },
      {
        label: 'Purchasing',
        href: '/admin/collections/inkopen',
        toelichting: 'Ingredient requirements per period',
        icoon: 'mand',
      },
      {
        label: 'Production',
        href: '/admin/collections/producties',
        toelichting: 'Kitchen and production lists',
        icoon: 'pan',
      },
      {
        label: 'Invoicing',
        href: '/admin/collections/facturen',
        toelichting: 'Invoices with VAT per rate',
        icoon: 'factuur',
      },
    ],
  },
  {
    titel: 'System',
    items: [
      {
        label: 'Packages',
        toelichting: 'Combined packages — still to be built',
        icoon: 'recept',
      },
      {
        label: 'Reporting',
        toelichting: 'Revenue, margin and occupancy — still to be built',
        icoon: 'grafiek',
      },
      {
        label: 'Settings',
        href: '/admin/globals/bedrijfsinstellingen',
        toelichting: 'Company details, colours and footer',
        icoon: 'tandwiel',
      },
    ],
  },
];

/** Welk navigatie-item hoort bij een pad? Gebruikt om de actieve regel te bepalen. */
export function actiefItem(pad: string): string | undefined {
  for (const groep of NAVIGATIE) {
    for (const item of groep.items) {
      if (item.href === undefined) continue;
      if (item.href === '/') {
        if (pad === '/') return item.href;
        continue;
      }
      if (pad === item.href || pad.startsWith(`${item.href}/`)) return item.href;
    }
  }
  return undefined;
}

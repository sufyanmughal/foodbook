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
    titel: 'Werk',
    items: [
      {
        label: 'Dashboard',
        href: '/rekenen',
        toelichting: 'Evenementen doorrekenen en documenten maken',
        icoon: 'bord',
      },
      {
        label: 'Foodbook',
        href: '/',
        toelichting: 'De presentatie met foto’s en gerechten',
        icoon: 'boek',
      },
    ],
  },
  {
    titel: 'Catalogus',
    items: [
      {
        label: 'Producten',
        href: '/admin/collections/producten',
        toelichting: 'Gerechten met prijs, eenheid en foto’s',
        icoon: 'pan',
      },
      {
        label: 'Recepturen',
        href: '/admin/collections/recepten',
        toelichting: 'Recepten met ingrediënten en bereidingswijze',
        icoon: 'recept',
      },
      {
        label: 'Ingrediënten',
        href: '/admin/collections/ingredienten',
        toelichting: 'Inkoopprijzen en allergenen per ingrediënt',
        icoon: 'mand',
      },
      {
        label: 'Leveranciers',
        href: '/admin/collections/leveranciers',
        toelichting: 'Waar de ingrediënten vandaan komen',
        icoon: 'wagen',
      },
      {
        label: 'Materialen',
        href: '/admin/collections/materialen',
        toelichting: 'Borden, bestek, gastronorm en warming',
        icoon: 'doos',
      },
      {
        label: 'Allergenen & dieet',
        href: '/admin/collections/allergenen',
        toelichting: 'De veertien wettelijke allergenen',
        icoon: 'allergeen',
      },
    ],
  },
  {
    titel: 'Operatie',
    items: [
      {
        label: 'Klanten',
        href: '/admin/collections/klanten',
        toelichting: 'Contactgegevens en historie',
        icoon: 'klant',
      },
      {
        label: 'Evenementen',
        href: '/admin/collections/evenementen',
        toelichting: 'Gasten, datum, producten en materialen',
        icoon: 'agenda',
      },
      {
        label: 'Calculaties',
        href: '/rekenen',
        toelichting: 'Doorrekenen en offertes genereren',
        icoon: 'rekenmachine',
      },
      {
        label: 'Inkoop',
        href: '/admin/collections/inkopen',
        toelichting: 'Ingrediëntbehoefte per periode',
        icoon: 'mand',
      },
      {
        label: 'Productie',
        href: '/admin/collections/producties',
        toelichting: 'Keuken- en productielijsten',
        icoon: 'pan',
      },
      {
        label: 'Facturatie',
        href: '/admin/collections/facturen',
        toelichting: 'Facturen met btw per tarief',
        icoon: 'factuur',
      },
    ],
  },
  {
    titel: 'Systeem',
    items: [
      {
        label: 'Arrangementen',
        toelichting: 'Samengestelde arrangementen — nog te bouwen',
        icoon: 'recept',
      },
      {
        label: 'Rapportage',
        toelichting: 'Omzet, marge en bezetting — nog te bouwen',
        icoon: 'grafiek',
      },
      {
        label: 'Instellingen',
        href: '/admin/globals/bedrijfsinstellingen',
        toelichting: 'Bedrijfsgegevens, kleuren en voettekst',
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

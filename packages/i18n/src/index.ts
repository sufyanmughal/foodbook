import type {
  Eenheid,
  EventStatus,
  FactuurStatus,
  LeveringStatus,
  OfferteStatus,
  OrderStatus,
  Rol,
} from '@foodbook/shared-types';
import { nl, type Catalogus } from './nl';
import { en } from './en';

export { nl } from './nl';
export { en } from './en';
export type { Catalogus } from './nl';

/** Available languages. English is the default; Dutch is kept as a second catalogue. */
export const TALEN = ['en', 'nl'] as const;
export type Taal = (typeof TALEN)[number];
export const STANDAARD_TAAL: Taal = 'en';

export const CATALOGI: Record<Taal, Catalogus> = { en, nl };

const LOCALES: Record<Taal, string> = { en: 'en-GB', nl: 'nl-NL' };

export class I18nFout extends Error {
  override readonly name = 'I18nFout';
}

/** Alle geldige berichtpaden, afgeleid uit de catalogus zelf. */
type BladPaden<T, Voorvoegsel extends string = ''> = {
  [K in keyof T & string]: T[K] extends string
    ? `${Voorvoegsel}${K}`
    : BladPaden<T[K], `${Voorvoegsel}${K}.`>;
}[keyof T & string];

export type Bericht = BladPaden<Catalogus>;

function haalPad(catalogus: Catalogus, pad: string): string | undefined {
  let huidig: unknown = catalogus;
  for (const deel of pad.split('.')) {
    if (typeof huidig !== 'object' || huidig === null) return undefined;
    huidig = (huidig as Record<string, unknown>)[deel];
  }
  return typeof huidig === 'string' ? huidig : undefined;
}

/**
 * Haalt een bericht op en vult `{placeholders}` in.
 *
 * Een ontbrekend pad is een programmeerfout, geen runtime-toestand: we gooien liever een fout
 * dan dat er een sleutel als "velden.naam" op een scherm of factuur belandt.
 */
export function t(
  pad: Bericht,
  params: Record<string, string | number> = {},
  taal: Taal = STANDAARD_TAAL,
): string {
  const bericht = haalPad(CATALOGI[taal], pad);
  if (bericht === undefined) {
    throw new I18nFout(`Onbekend berichtpad: "${pad}" (taal ${taal}).`);
  }

  return bericht.replace(/\{(\w+)\}/g, (_volledig, sleutel: string) => {
    const waarde = params[sleutel];
    if (waarde === undefined) {
      throw new I18nFout(`Bericht "${pad}" mist parameter "${sleutel}".`);
    }
    return String(waarde);
  });
}

export function rolLabel(rol: Rol): string {
  return CATALOGI[STANDAARD_TAAL].rollen[rol];
}

export function evenementStatusLabel(status: EventStatus): string {
  return CATALOGI[STANDAARD_TAAL].status.evenement[status];
}

export function offerteStatusLabel(status: OfferteStatus): string {
  return CATALOGI[STANDAARD_TAAL].status.offerte[status];
}

export function orderStatusLabel(status: OrderStatus): string {
  return CATALOGI[STANDAARD_TAAL].status.order[status];
}

export function leveringStatusLabel(status: LeveringStatus): string {
  return CATALOGI[STANDAARD_TAAL].status.levering[status];
}

export function factuurStatusLabel(status: FactuurStatus): string {
  return CATALOGI[STANDAARD_TAAL].status.factuur[status];
}

export function eenheidLabel(eenheid: Eenheid): string {
  return CATALOGI[STANDAARD_TAAL].eenheden[eenheid];
}

/** Formatteert een bedrag als Nederlandse munteenheid: `€ 1.234,56`. */
export function formatteerBedrag(bedrag: number, taal: Taal = STANDAARD_TAAL): string {
  return new Intl.NumberFormat(LOCALES[taal], { style: 'currency', currency: 'EUR' }).format(bedrag);
}

/** Formatteert een ISO-datum als `20 juni 2026`. */
export function formatteerDatum(isoDatum: string, taal: Taal = STANDAARD_TAAL): string {
  return new Intl.DateTimeFormat(LOCALES[taal], {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(naarDatum(isoDatum));
}

/** Formatteert een ISO-datum als `20-06-2026`. */
export function formatteerDatumKort(isoDatum: string, taal: Taal = STANDAARD_TAAL): string {
  return new Intl.DateTimeFormat(LOCALES[taal], {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(naarDatum(isoDatum));
}

/** Formatteert een hoeveelheid met zijn eenheid: `2,3 kg`. */
export function formatteerHoeveelheid(
  waarde: number,
  eenheid: Eenheid,
  taal: Taal = STANDAARD_TAAL,
): string {
  const getal = new Intl.NumberFormat(LOCALES[taal], { maximumFractionDigits: 3 }).format(waarde);
  return `${getal} ${eenheidLabel(eenheid)}`;
}

/** Geeft de periode-aanduiding voor een datum, bv. `juni 2026`. */
export function formatteerMaand(isoDatum: string, taal: Taal = STANDAARD_TAAL): string {
  return new Intl.DateTimeFormat(LOCALES[taal], {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(naarDatum(isoDatum));
}

function naarDatum(isoDatum: string): Date {
  const datum = new Date(`${isoDatum}T00:00:00Z`);
  if (Number.isNaN(datum.getTime())) {
    throw new I18nFout(`Ongeldige datum: "${isoDatum}".`);
  }
  return datum;
}

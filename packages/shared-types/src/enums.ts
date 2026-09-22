/**
 * Enums uit ARCHITECTURE.md §3.
 *
 * Ze staan hier als `const`-arrays en niet als TypeScript `enum`, omdat Payload CMS
 * `select`-velden een platte lijst met toegestane waarden verwacht. Zo is er één
 * bron van waarheid voor zowel de database-validatie als de types in de rekenmotor.
 */

/** ID van een record. Payload levert bij Postgres een string-UUID, bij SQLite een nummer. */
export type ID = string;

/** §3.1 / §3.3 — eenheid van een product of ingrediënt. */
export const EENHEDEN = ['gram', 'ml', 'stuk', 'kg', 'liter'] as const;
export type Eenheid = (typeof EENHEDEN)[number];

/** Dimensie bepaalt of eenheden onderling omrekenbaar zijn (gram↔kg, ml↔liter). */
export type Dimensie = 'massa' | 'volume' | 'aantal';

/** §3.7 — statusworkflow van een evenement. */
export const EVENT_STATUS = [
  'concept',
  'offerte_verzonden',
  'bevestigd',
  'in_productie',
  'geleverd',
  'gefactureerd',
  'afgerond',
] as const;
export type EventStatus = (typeof EVENT_STATUS)[number];

/** §3.10 — statusworkflow van een offerte. */
export const OFFERTE_STATUS = [
  'concept',
  'verzonden',
  'geaccepteerd',
  'verlopen',
  'geweigerd',
] as const;
export type OfferteStatus = (typeof OFFERTE_STATUS)[number];

/** §3.11 — statusworkflow van een order. */
export const ORDER_STATUS = ['bevestigd', 'in_productie', 'gereed', 'geleverd'] as const;
export type OrderStatus = (typeof ORDER_STATUS)[number];

/** §3.15 — statusworkflow van een levering. */
export const LEVERING_STATUS = ['gepland', 'onderweg', 'geleverd'] as const;
export type LeveringStatus = (typeof LEVERING_STATUS)[number];

/** §3.16 — statusworkflow van een factuur. */
export const FACTUUR_STATUS = ['concept', 'verzonden', 'betaald', 'te_laat'] as const;
export type FactuurStatus = (typeof FACTUUR_STATUS)[number];

/** §3.17 — rollen. */
export const ROLLEN = ['beheerder', 'verkoop', 'keuken', 'logistiek'] as const;
export type Rol = (typeof ROLLEN)[number];

/** §3.9 — automatisch gegenereerde fotovarianten. */
export const MEDIA_VARIANTEN = [
  'thumbnail',
  'foodbook-card',
  'foodbook-hero',
  'print',
] as const;
export type MediaVariant = (typeof MEDIA_VARIANTEN)[number];

/** §3.14 — afvinkstatus van een paklijstregel. */
export type AfvinkStatus = 'open' | 'afgevinkt';

export const DIMENSIE_PER_EENHEID: Record<Eenheid, Dimensie> = {
  gram: 'massa',
  kg: 'massa',
  ml: 'volume',
  liter: 'volume',
  stuk: 'aantal',
};

/** De canonieke (basis-)eenheid per dimensie waar de rekenmotor intern mee werkt. */
export const BASIS_EENHEID: Record<Dimensie, Eenheid> = {
  massa: 'gram',
  volume: 'ml',
  aantal: 'stuk',
};

/** Omrekenfactor naar de basis-eenheid van de dimensie. */
export const EENHEID_FACTOR: Record<Eenheid, number> = {
  gram: 1,
  kg: 1000,
  ml: 1,
  liter: 1000,
  stuk: 1,
};

import { EENHEID_FACTOR, type Eenheid } from '@foodbook/shared-types';
import { vanBasis } from './units';

/**
 * Marge waarmee we afronden, om te voorkomen dat een binaire drijvende-kommaartefact
 * (bv. 2.0000000000000004) onnodig een hele inkoopeenheid extra oplevert.
 */
const EPSILON = 1e-9;

/**
 * §4.4 — rondt naar boven af op hele stappen van `stapEenheid`.
 * Werkt in de basis-eenheid van de dimensie en geeft ook weer in de basis-eenheid terug.
 */
export function rondOpVolledigeStappen(hoeveelheidInBasis: number, stapEenheid: Eenheid): number {
  if (hoeveelheidInBasis <= 0) return 0;
  const stap = EENHEID_FACTOR[stapEenheid];
  return Math.ceil(hoeveelheidInBasis / stap - EPSILON) * stap;
}

/**
 * §4.4 — inkoophoeveelheid, uitgedrukt in de inkoopeenheid van het ingrediënt.
 * 2,3 kg zalm die per kg wordt ingekocht levert 3 (kg) op.
 */
export function inkoopHoeveelheid(hoeveelheidInBasis: number, inkoopeenheid: Eenheid): number {
  return vanBasis(rondOpVolledigeStappen(hoeveelheidInBasis, inkoopeenheid), inkoopeenheid);
}

/**
 * §4.4 — productie-/keukenhoeveelheid: exact, zonder afronding, weergegeven in `weergaveEenheid`.
 */
export function productieHoeveelheid(hoeveelheidInBasis: number, weergaveEenheid: Eenheid): number {
  return vanBasis(hoeveelheidInBasis, weergaveEenheid);
}

/** Rondt een geldbedrag af op hele eurocenten. */
export function rondGeldAf(bedrag: number): number {
  const afgerond = Math.round((Math.abs(bedrag) + Number.EPSILON) * 100) / 100;
  return bedrag < 0 ? -afgerond : afgerond;
}

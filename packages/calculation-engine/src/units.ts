import {
  BASIS_EENHEID,
  DIMENSIE_PER_EENHEID,
  EENHEID_FACTOR,
  type Dimensie,
  type Eenheid,
} from '@foodbook/shared-types';
import { RekenFout } from './errors';

export function dimensieVan(eenheid: Eenheid): Dimensie {
  return DIMENSIE_PER_EENHEID[eenheid];
}

/** De canonieke eenheid van de dimensie: massa → gram, volume → ml, aantal → stuk. */
export function basisEenheidVan(eenheid: Eenheid): Eenheid {
  return BASIS_EENHEID[dimensieVan(eenheid)];
}

export function zijnVerenigbaar(a: Eenheid, b: Eenheid): boolean {
  return dimensieVan(a) === dimensieVan(b);
}

/** Rekent een hoeveelheid om naar de basis-eenheid van zijn dimensie. */
export function naarBasis(hoeveelheid: number, eenheid: Eenheid): number {
  return hoeveelheid * EENHEID_FACTOR[eenheid];
}

/** Rekent een hoeveelheid in de basis-eenheid terug naar de opgegeven eenheid. */
export function vanBasis(waarde: number, eenheid: Eenheid): number {
  return waarde / EENHEID_FACTOR[eenheid];
}

/** Rekent rechtstreeks tussen twee eenheden van dezelfde dimensie om. */
export function converteer(hoeveelheid: number, van: Eenheid, naar: Eenheid): number {
  if (!zijnVerenigbaar(van, naar)) {
    throw new RekenFout(
      `Eenheid "${van}" kan niet worden omgerekend naar "${naar}": verschillende dimensies.`,
    );
  }
  return vanBasis(naarBasis(hoeveelheid, van), naar);
}

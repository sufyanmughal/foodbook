import { EENHEID_FACTOR, type Ingredient } from '@foodbook/shared-types';
import { RekenFout } from './errors';

/**
 * Prijs per basis-eenheid van de dimensie (per gram / per ml / per stuk).
 *
 * De inkoopprijs hoort bij één inkoopeenheid: € 12,50 per kg wordt € 0,0125 per gram.
 */
export function prijsPerBasiseenheid(ingredient: Ingredient): number {
  return ingredient.inkoopprijs / EENHEID_FACTOR[ingredient.inkoopeenheid];
}

/**
 * Kostprijs van een exacte hoeveelheid (in basis-eenheden) van een ingrediënt.
 *
 * §4.2: dit is de *kostprijs*. De verkoopprijs komt uit `Product.prijsPerPersoon` en wordt
 * hier nooit uit afgeleid — marge is een ondernemersbeslissing, geen formule.
 */
export function kostprijsVoorHoeveelheid(ingredient: Ingredient, hoeveelheidInBasis: number): number {
  if (!Number.isFinite(hoeveelheidInBasis) || hoeveelheidInBasis < 0) {
    throw new RekenFout(
      `Ongeldige hoeveelheid voor ingrediënt "${ingredient.naam}": ${String(hoeveelheidInBasis)}.`,
    );
  }
  return hoeveelheidInBasis * prijsPerBasiseenheid(ingredient);
}

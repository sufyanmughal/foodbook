import type { Inkoop, InkoopRegel, Ingredient, Leverancier } from '@foodbook/shared-types';
import { haalOp } from './errors';
import { inkoopHoeveelheid } from './rounding';
import { naarBasis } from './units';
import type { EvenementProductie } from './productie';

export interface InkoopOpties {
  periodeVan: string;
  periodeTot: string;
  /** Trek de geregistreerde voorraad af van de behoefte (standaard aan). */
  houdVoorraadAf?: boolean;
}

interface VerzameldeBehoefte {
  hoeveelheid: number;
  kostprijs: number;
  herkomst: Set<string>;
}

/**
 * §3.13/§4.4 — inkoop aggregeert de ingrediëntbehoefte over **alle** producties in een periode,
 * niet per los evenement, en rondt pas ná aggregatie naar boven af op de inkoopeenheid.
 *
 * Dat is precies waarom 2 × 1,4 kg zalm bij een handelaar die per kg verkoopt 3 kg oplevert en
 * niet 2 × 2 = 4 kg: er wordt één keer per ingrediënt ingekocht, niet per evenement.
 */
export function aggregeerInkoop(
  producties: EvenementProductie[],
  ingredienten: Record<string, Ingredient>,
  leveranciers: Record<string, Leverancier>,
  opties: InkoopOpties,
): Inkoop {
  const houdVoorraadAf = opties.houdVoorraadAf ?? true;
  const behoeften = new Map<string, VerzameldeBehoefte>();

  for (const productie of producties) {
    for (const regel of productie.ingredientTotalen) {
      const bestaand = behoeften.get(regel.ingredient);
      if (bestaand === undefined) {
        behoeften.set(regel.ingredient, {
          hoeveelheid: regel.hoeveelheid,
          kostprijs: regel.kostprijs,
          herkomst: new Set([productie.evenement]),
        });
        continue;
      }
      bestaand.hoeveelheid += regel.hoeveelheid;
      bestaand.kostprijs += regel.kostprijs;
      bestaand.herkomst.add(productie.evenement);
    }
  }

  const regels: InkoopRegel[] = [];
  for (const [ingredientId, behoefte] of behoeften) {
    const ingredient = haalOp(ingredienten, ingredientId, 'Ingrediënt');
    // Voorraad staat in de inkoopeenheid (bv. kg); de behoefte in de basis-eenheid (gram).
    const voorraad = houdVoorraadAf
      ? naarBasis(ingredient.voorraad ?? 0, ingredient.inkoopeenheid)
      : 0;
    const tekort = Math.max(0, behoefte.hoeveelheid - voorraad);
    const aantal = inkoopHoeveelheid(tekort, ingredient.inkoopeenheid);

    if (aantal <= 0) continue;

    const leverancier =
      ingredient.leverancier === undefined ? undefined : leveranciers[ingredient.leverancier];

    regels.push({
      ingredient: ingredient.id,
      naam: ingredient.naam,
      hoeveelheid: aantal,
      inkoopEenheid: ingredient.inkoopeenheid,
      eenheidsprijs: ingredient.inkoopprijs,
      kostprijs: aantal * ingredient.inkoopprijs,
      ...(leverancier !== undefined
        ? { leverancier: leverancier.id, leverancierNaam: leverancier.naam }
        : {}),
      herkomst: [...behoefte.herkomst].sort(),
    });
  }

  regels.sort((a, b) => {
    const leverancierVergelijking = (a.leverancierNaam ?? '~').localeCompare(
      b.leverancierNaam ?? '~',
      'nl',
    );
    return leverancierVergelijking !== 0 ? leverancierVergelijking : a.naam.localeCompare(b.naam, 'nl');
  });

  return { periodeVan: opties.periodeVan, periodeTot: opties.periodeTot, regels };
}

/** Groepeert een inkooplijst per leverancier, voor de inkooplijst-documenten (§5). */
export function groepeerPerLeverancier(inkoop: Inkoop): Map<string, InkoopRegel[]> {
  const groepen = new Map<string, InkoopRegel[]>();
  for (const regel of inkoop.regels) {
    const sleutel = regel.leverancierNaam ?? 'Geen leverancier';
    const groep = groepen.get(sleutel);
    if (groep === undefined) {
      groepen.set(sleutel, [regel]);
    } else {
      groep.push(regel);
    }
  }
  return groepen;
}

import type {
  Evenement,
  EventRegel,
  Eenheid,
  Ingredient,
  Product,
  Recept,
  ReceptRegel,
} from '@foodbook/shared-types';
import { RekenFout, haalOp } from './errors';
import { basisEenheidVan, naarBasis, zijnVerenigbaar } from './units';

/** Uitkomst van §4.1 voor één evenementregel. */
export interface PortieBerekening {
  /** Aantal gasten waarvoor deze regel geldt (override of evenementaantal). */
  aantalGasten: number;
  /** Effectieve hoeveelheid per persoon (override of productstandaard). */
  hoeveelheidPerPersoon: number;
  /** Totale producthoeveelheid: `hoeveelheidPerPersoon × aantalGasten`, in de producteenheid. */
  productHoeveelheid: number;
  /**
   * Schaal waarop het recept als geschreven wordt vermenigvuldigd.
   * 1 betekent: precies het recept zoals het er staat.
   */
  schaal: number;
}

/**
 * §4.1/§4.2 — bepaalt de effectieve portie voor één evenementregel.
 *
 * De schaal is `(hoeveelheidPerPersoon × aantalGasten) ÷ (recept.hoeveelheidPerPersoon × recept.basisPorties)`.
 * Zonder recept is er niets te schalen en blijft de schaal 1.
 */
export function berekenPorties(
  product: Product,
  regel: EventRegel | undefined,
  evenement: Evenement,
  recept?: Recept,
): PortieBerekening {
  const aantalGasten = regel?.aantalGastenOverride ?? evenement.aantalGasten;
  const hoeveelheidPerPersoon =
    regel?.hoeveelheidPerPersoonOverride ?? product.hoeveelheidPerPersoon;

  if (!Number.isFinite(aantalGasten) || aantalGasten < 0) {
    throw new RekenFout(
      `Ongeldig aantal gasten voor product "${product.naam}": ${String(aantalGasten)}.`,
    );
  }
  if (!Number.isFinite(hoeveelheidPerPersoon) || hoeveelheidPerPersoon <= 0) {
    throw new RekenFout(
      `Ongeldige hoeveelheid per persoon voor product "${product.naam}": ${String(hoeveelheidPerPersoon)}.`,
    );
  }

  const productHoeveelheid = hoeveelheidPerPersoon * aantalGasten;

  if (recept === undefined) {
    return { aantalGasten, hoeveelheidPerPersoon, productHoeveelheid, schaal: 1 };
  }

  if (!Number.isFinite(recept.basisPorties) || recept.basisPorties <= 0) {
    throw new RekenFout(`Recept "${recept.naam}" heeft een ongeldig aantal basisporties.`);
  }
  if (!Number.isFinite(recept.hoeveelheidPerPersoon) || recept.hoeveelheidPerPersoon <= 0) {
    throw new RekenFout(
      `Recept "${recept.naam}" heeft geen geldige standaard portiegrootte (hoeveelheidPerPersoon).`,
    );
  }
  if (!zijnVerenigbaar(recept.eenheid, product.eenheid)) {
    throw new RekenFout(
      `Recept "${recept.naam}" rekent in ${recept.eenheid} maar product "${product.naam}" in ${product.eenheid}.`,
    );
  }

  const receptUitkomst = recept.hoeveelheidPerPersoon * recept.basisPorties;
  return {
    aantalGasten,
    hoeveelheidPerPersoon,
    productHoeveelheid,
    schaal: productHoeveelheid / receptUitkomst,
  };
}

/** Eén geschaalde ingrediëntbehoefte, exact en nog niet praktisch afgerond (§4.4). */
export interface GeschaaldIngredient {
  ingredient: string;
  naam: string;
  /** Exacte hoeveelheid in de basis-eenheid van de dimensie (gram / ml / stuk). */
  hoeveelheid: number;
  /** De basis-eenheid waarin `hoeveelheid` is uitgedrukt. */
  basisEenheid: Eenheid;
}

/**
 * §4.1 — de kernfunctie `benodigde_hoeveelheid(ingredient, event)`.
 *
 * Schaalt elke receptregel met de schaal uit `berekenPorties` en normaliseert naar de
 * basis-eenheid van de dimensie, zodat massa- en volume-eenheden onderling vergelijkbaar
 * en optelbaar zijn.
 */
export function schaalRecept(
  recept: Recept,
  schaal: number,
  ingredienten: Record<string, Ingredient>,
): GeschaaldIngredient[] {
  return recept.ingredienten.map((regel: ReceptRegel) => {
    const ingredient = haalOp(ingredienten, regel.ingredient, 'Ingrediënt');
    if (!zijnVerenigbaar(regel.eenheid, ingredient.inkoopeenheid)) {
      throw new RekenFout(
        `Receptregel voor "${ingredient.naam}" staat in ${regel.eenheid}, maar het ingrediënt wordt ingekocht in ${ingredient.inkoopeenheid}.`,
      );
    }
    return {
      ingredient: ingredient.id,
      naam: ingredient.naam,
      hoeveelheid: naarBasis(regel.hoeveelheid * schaal, regel.eenheid),
      basisEenheid: basisEenheidVan(regel.eenheid),
    };
  });
}

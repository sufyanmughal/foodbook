import type {
  Evenement,
  Ingredient,
  Product,
  ProductieIngredientRegel,
  ProductieReceptRegel,
  Recept,
} from '@foodbook/shared-types';
import { haalOp } from './errors';
import { kostprijsVoorHoeveelheid } from './kostprijs';
import { berekenPorties, schaalRecept } from './scaling';

/** Alles wat de rekenmotor nodig heeft om een evenement door te rekenen. */
export interface ProductieContext {
  recepten: Record<string, Recept>;
  ingredienten: Record<string, Ingredient>;
}

export interface EvenementProductie {
  evenement: string;
  aantalGasten: number;
  regels: ProductieReceptRegel[];
  /** Opgetelde ingrediëntbehoefte over alle regels heen, exact (niet afgerond). */
  ingredientTotalen: ProductieIngredientRegel[];
}

/**
 * §3.12 — explodeert één evenementregel naar geschaalde ingrediëntregels.
 *
 * Een product zonder recept levert geen ingrediëntregels op; dat is een ingekocht artikel
 * dat als product op de productielijst blijft staan (`productHoeveelheid`).
 */
export function berekenProductieRegel(
  product: Product,
  evenement: Evenement,
  context: ProductieContext,
  regelIndex: number,
): ProductieReceptRegel {
  const eventRegel = evenement.producten[regelIndex];
  const recept = product.recept === undefined ? undefined : context.recepten[product.recept];
  const porties = berekenPorties(product, eventRegel, evenement, recept);

  const ingredienten: ProductieIngredientRegel[] =
    recept === undefined
      ? []
      : schaalRecept(recept, porties.schaal, context.ingredienten).map((geschaald) => {
          const ingredient = haalOp(context.ingredienten, geschaald.ingredient, 'Ingrediënt');
          return {
            ingredient: geschaald.ingredient,
            naam: geschaald.naam,
            hoeveelheid: geschaald.hoeveelheid,
            basisEenheid: geschaald.basisEenheid,
            kostprijs: kostprijsVoorHoeveelheid(ingredient, geschaald.hoeveelheid),
          };
        });

  return {
    product: product.id,
    productNaam: product.naam,
    ...(recept !== undefined ? { recept: recept.id, receptNaam: recept.naam } : {}),
    ...(recept?.keukenstation !== undefined ? { keukenstation: recept.keukenstation } : {}),
    aantalGasten: porties.aantalGasten,
    hoeveelheidPerPersoon: porties.hoeveelheidPerPersoon,
    eenheid: product.eenheid,
    productHoeveelheid: porties.productHoeveelheid,
    ingredienten,
    kostprijs: ingredienten.reduce((som, regel) => som + regel.kostprijs, 0),
  };
}

/**
 * §3.12 — de volledige productie van één evenement: elke gekozen productregel, geschaald
 * naar het aantal gasten van dat evenement.
 */
export function berekenEvenementProductie(
  evenement: Evenement,
  producten: Record<string, Product>,
  context: ProductieContext,
): EvenementProductie {
  const regels = evenement.producten.map((eventRegel, index) =>
    berekenProductieRegel(
      haalOp(producten, eventRegel.product, 'Product'),
      evenement,
      context,
      index,
    ),
  );

  const totalen = new Map<string, ProductieIngredientRegel>();
  for (const regel of regels) {
    for (const ingredientRegel of regel.ingredienten) {
      const bestaand = totalen.get(ingredientRegel.ingredient);
      if (bestaand === undefined) {
        totalen.set(ingredientRegel.ingredient, { ...ingredientRegel });
        continue;
      }
      bestaand.hoeveelheid += ingredientRegel.hoeveelheid;
      bestaand.kostprijs += ingredientRegel.kostprijs;
    }
  }

  return {
    evenement: evenement.id,
    aantalGasten: evenement.aantalGasten,
    regels,
    ingredientTotalen: [...totalen.values()].sort((a, b) => a.naam.localeCompare(b.naam, 'nl')),
  };
}

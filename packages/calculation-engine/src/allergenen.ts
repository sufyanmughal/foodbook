import type { Allergeen, Ingredient, Product, Recept } from '@foodbook/shared-types';
import { haalOp } from './errors';

function uniekeIds(ids: string[]): string[] {
  return [...new Set(ids)].sort();
}

/**
 * §4.3 — allergenen van een recept: de unie van de allergenen van al zijn ingrediënten.
 * Nooit handmatig onderhouden, altijd live afgeleid van de ingrediëntlaag (de bron van waarheid).
 */
export function allergenenVanRecept(
  recept: Recept,
  ingredienten: Record<string, Ingredient>,
): string[] {
  return uniekeIds(
    recept.ingredienten.flatMap((regel) => haalOp(ingredienten, regel.ingredient, 'Ingrediënt').allergenen),
  );
}

/**
 * §4.3 — allergenen van een product: de unie van de allergenen uit het recept plus de
 * directe tags op het product zelf (voor samengestelde/ingekochte artikelen zonder recept).
 */
export function allergenenVanProduct(
  product: Product,
  recepten: Record<string, Recept>,
  ingredienten: Record<string, Ingredient>,
): string[] {
  const uitRecept =
    product.recept === undefined
      ? []
      : allergenenVanRecept(haalOp(recepten, product.recept, 'Recept'), ingredienten);
  return uniekeIds([...uitRecept, ...product.allergenen]);
}

/** Zet allergenen-ids om naar de volledige records, gesorteerd op naam. */
export function allergenenDetails(
  ids: string[],
  allergenen: Record<string, Allergeen>,
): Allergeen[] {
  return ids
    .map((id) => allergenen[id])
    .filter((allergeen): allergeen is Allergeen => allergeen !== undefined)
    .sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));
}

/**
 * B15 — producten waarvan de allergeneninformatie ontbreekt.
 *
 * Een product zonder recept heeft geen ingrediëntlaag om allergenen uit af te leiden. Zonder
 * directe tags is er dus niets bekend — en "niets bekend" mag nooit als "bevat geen allergenen"
 * op een allergenenlijst terechtkomen. Dat is het gevaarlijkste antwoord dat het systeem kan
 * geven, want het staat er dan met dezelfde stelligheid als een gecontroleerde lege lijst.
 *
 * De klant vroeg hier expliciet om: het systeem moet waarschuwen, niet stilzwijgend aannemen.
 * Retourneert de producten waarbij dit speelt, zodat de UI en het document het kunnen melden.
 */
export function productenZonderAllergenenInfo(producten: Product[]): Product[] {
  return producten.filter(
    (product) => product.recept === undefined && product.allergenen.length === 0,
  );
}

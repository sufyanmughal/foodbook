import type { ID } from './enums';
import type {
  Allergeen,
  BtwTarief,
  Evenement,
  Ingredient,
  Klant,
  Leverancier,
  Materiaal,
  Product,
  Recept,
} from './entities';

/**
 * Genormaliseerde dataset die de rekenmotor nodig heeft (ARCHITECTURE.md §4).
 *
 * De motor is bewust een pure functie-bibliotheek: hij leest nooit zelf uit de database.
 * De aanroeper (Payload-hook, API-route of test) levert één zo'n snapshot aan, waardoor
 * elke rekenregel los en herhaalbaar te testen is.
 */
export interface RekenDataset {
  evenement: Evenement;
  producten: Record<ID, Product>;
  recepten: Record<ID, Recept>;
  ingredienten: Record<ID, Ingredient>;
  allergenen: Record<ID, Allergeen>;
  btwTarieven: Record<ID, BtwTarief>;
  materialen?: Record<ID, Materiaal>;
  leveranciers?: Record<ID, Leverancier>;
  klanten?: Record<ID, Klant>;
}

/** Bouwt lookup-maps uit een platte lijst; scheelt boilerplate bij het opbouwen van een dataset. */
export function indexeer<T extends { id: ID }>(rijen: T[]): Record<ID, T> {
  const map: Record<ID, T> = {};
  for (const rij of rijen) {
    map[rij.id] = rij;
  }
  return map;
}

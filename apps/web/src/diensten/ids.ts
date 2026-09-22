import type { ID } from '@foodbook/shared-types';

/**
 * Payload gebruikt bij SQLite een nummer als id en bij PostgreSQL een UUID-string. De rest van
 * de applicatie rekent overal met strings (zie `shared-types`), zodat het niet uitmaakt welke
 * database eronder zit. Bij het terugschrijven naar Payload moet die conversie dus terug.
 *
 * Zonder deze stap geeft Payload een validatiefout als "het veld Evenement is ongeldig", omdat
 * een numerieke id als tekst wordt aangeboden.
 */
export function naarPayloadId(id: ID): number | string {
  return /^\d+$/.test(id) ? Number(id) : id;
}

/** Zet een lijst ids om naar de vorm die Payload verwacht. */
export function naarPayloadIds(ids: ID[]): (number | string)[] {
  return ids.map(naarPayloadId);
}

/**
 * Fout bij het rekenen op onvolledige of tegenstrijdige data.
 *
 * De motor gooit bewust liever een fout dan dat hij stil een verkeerd getal doorgeeft:
 * een fout hier komt terecht op een inkooplijst, een keukenlijst of een factuur.
 */
export class RekenFout extends Error {
  override readonly name = 'RekenFout';

  constructor(message: string) {
    super(message);
  }
}

/** Haalt een verplicht record uit een lookup-map, of gooit een leesbare fout. */
export function haalOp<T>(map: Record<string, T>, id: string, soort: string): T {
  const record = map[id];
  if (record === undefined) {
    throw new RekenFout(`${soort} met id "${id}" niet gevonden.`);
  }
  return record;
}

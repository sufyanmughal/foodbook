import { describe, expect, it } from 'vitest';
import { aggregeerInkoop, groepeerPerLeverancier } from '../inkoop';
import { berekenEvenementProductie } from '../productie';
import { lookup, maakEvenement } from './fixtures';

const context = { recepten: lookup.recepten, ingredienten: lookup.ingredienten };

function maakProducties(aantalEvenementen: number, gasten: number) {
  return Array.from({ length: aantalEvenementen }, (_, index) =>
    berekenEvenementProductie(
      maakEvenement({
        id: `evt-${index + 1}`,
        aantalGasten: gasten,
        producten: [{ product: 'prod-zalm' }],
        materialen: [],
      }),
      lookup.producten,
      context,
    ),
  );
}

describe('inkoopaggregatie (§3.13/§4.4)', () => {
  it('telt de behoefte op over meerdere evenementen en rondt pas daarna af', () => {
    const inkoop = aggregeerInkoop(
      maakProducties(3, 6),
      lookup.ingredienten,
      lookup.leveranciers,
      { periodeVan: '2026-06-01', periodeTot: '2026-06-30', houdVoorraadAf: false },
    );

    const zalm = inkoop.regels.find((regel) => regel.ingredient === 'ing-zalm')!;
    const room = inkoop.regels.find((regel) => regel.ingredient === 'ing-room')!;

    expect(zalm.hoeveelheid).toBe(4);
    expect(zalm.inkoopEenheid).toBe('kg');
    expect(room.hoeveelheid).toBe(1);
  });

  it('berekent de inkoopkostprijs per regel', () => {
    const inkoop = aggregeerInkoop(
      maakProducties(3, 6),
      lookup.ingredienten,
      lookup.leveranciers,
      { periodeVan: '2026-06-01', periodeTot: '2026-06-30', houdVoorraadAf: false },
    );

    expect(inkoop.regels.find((regel) => regel.ingredient === 'ing-zalm')?.kostprijs).toBe(100);
  });

  it('houdt de herkomst per ingrediënt bij voor de audit trail', () => {
    const inkoop = aggregeerInkoop(
      maakProducties(3, 6),
      lookup.ingredienten,
      lookup.leveranciers,
      { periodeVan: '2026-06-01', periodeTot: '2026-06-30', houdVoorraadAf: false },
    );

    expect(inkoop.regels.find((regel) => regel.ingredient === 'ing-zalm')?.herkomst).toEqual([
      'evt-1',
      'evt-2',
      'evt-3',
    ]);
  });

  it('trekt de geregistreerde voorraad af van de behoefte', () => {
    const metVoorraad = {
      ...lookup.ingredienten,
      'ing-zalm': { ...lookup.ingredienten['ing-zalm']!, voorraad: 1 },
    };

    const inkoop = aggregeerInkoop(maakProducties(3, 6), metVoorraad, lookup.leveranciers, {
      periodeVan: '2026-06-01',
      periodeTot: '2026-06-30',
    });

    expect(inkoop.regels.find((regel) => regel.ingredient === 'ing-zalm')?.hoeveelheid).toBe(3);
  });

  it('laat de voorraad staan als aftrekken uitgeschakeld is', () => {
    const metVoorraad = {
      ...lookup.ingredienten,
      'ing-zalm': { ...lookup.ingredienten['ing-zalm']!, voorraad: 1 },
    };

    const inkoop = aggregeerInkoop(maakProducties(3, 6), metVoorraad, lookup.leveranciers, {
      periodeVan: '2026-06-01',
      periodeTot: '2026-06-30',
      houdVoorraadAf: false,
    });

    expect(inkoop.regels.find((regel) => regel.ingredient === 'ing-zalm')?.hoeveelheid).toBe(4);
  });

  it('laat ingrediënten weg waarvoor de voorraad toereikend is', () => {
    const ruimVoorraad = {
      ...lookup.ingredienten,
      'ing-zalm': { ...lookup.ingredienten['ing-zalm']!, voorraad: 10 },
    };

    const inkoop = aggregeerInkoop(maakProducties(3, 6), ruimVoorraad, lookup.leveranciers, {
      periodeVan: '2026-06-01',
      periodeTot: '2026-06-30',
    });

    expect(inkoop.regels.some((regel) => regel.ingredient === 'ing-zalm')).toBe(false);
  });

  it('groepeert per leverancier en sorteert daarop', () => {
    const inkoop = aggregeerInkoop(
      maakProducties(3, 6),
      lookup.ingredienten,
      lookup.leveranciers,
      { periodeVan: '2026-06-01', periodeTot: '2026-06-30', houdVoorraadAf: false },
    );

    const groepen = groepeerPerLeverancier(inkoop);

    expect([...groepen.keys()]).toEqual(['Groothandel Van Dijk', 'Vishandel De Golf']);
    expect(groepen.get('Vishandel De Golf')?.map((regel) => regel.naam)).toEqual(['Zalmfilet']);
  });

  it('geeft een lege lijst zonder producties', () => {
    const inkoop = aggregeerInkoop([], lookup.ingredienten, lookup.leveranciers, {
      periodeVan: '2026-06-01',
      periodeTot: '2026-06-30',
    });

    expect(inkoop.regels).toEqual([]);
  });
});

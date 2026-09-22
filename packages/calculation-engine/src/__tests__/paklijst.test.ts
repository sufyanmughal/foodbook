import { describe, expect, it } from 'vitest';
import type { MateriaalBehoefte, Picking } from '@foodbook/shared-types';
import { isPaklijstCompleet, maakPaklijst, vinkRegelAf } from '../paklijst';
import { berekenEvenementProductie } from '../productie';
import { lookup, maakEvenement } from './fixtures';

const context = { recepten: lookup.recepten, ingredienten: lookup.ingredienten };

/** Materialen zoals `berekenMaterialen` ze aanlevert (B14). */
const materiaalBehoefte: MateriaalBehoefte[] = [
  {
    materiaal: 'mat-bord',
    naam: 'Dinerbord',
    eenheid: 'stuk',
    automatisch: 100,
    handmatig: 0,
    totaal: 100,
    herkomst: ['Zalmfilet met roomsaus'],
  },
  {
    materiaal: 'mat-bestek',
    naam: 'Bestekset',
    eenheid: 'stuk',
    automatisch: 0,
    handmatig: 120,
    totaal: 120,
    herkomst: [],
  },
];

function maakLijst() {
  const evenement = maakEvenement();
  const productie = berekenEvenementProductie(evenement, lookup.producten, context);
  return { evenement, picking: { ...maakPaklijst(productie, materiaalBehoefte), id: 'pick-1' } };
}

describe('paklijst (§3.14)', () => {
  it('combineert voedsel uit de productie met de berekende materialen', () => {
    const { picking } = maakLijst();

    expect(picking.regels.map((regel) => [regel.soort, regel.omschrijving])).toEqual([
      ['voedsel', 'Zalmfilet met roomsaus'],
      ['voedsel', 'Gepofte krielaardappel'],
      ['voedsel', 'Huiswijn rood'],
      ['materiaal', 'Dinerbord'],
      ['materiaal', 'Bestekset'],
    ]);
  });

  it('neemt de geschaalde hoeveelheden en eenheden over', () => {
    const { picking } = maakLijst();

    expect(picking.regels[0]).toMatchObject({
      referentie: 'prod-zalm',
      hoeveelheid: 18000,
      eenheid: 'gram',
      afgevinkt: false,
    });
    expect(picking.regels[3]).toMatchObject({ hoeveelheid: 100, eenheid: 'stuk' });
  });

  it('neemt automatisch berekend materiaal mee, niet alleen wat handmatig is ingevoerd', () => {
    const { picking } = maakLijst();

    expect(picking.regels.find((regel) => regel.omschrijving === 'Dinerbord')).toBeDefined();
  });

  it('laat materialen met een totaal van nul weg', () => {
    const leeg: MateriaalBehoefte[] = [
      { ...materiaalBehoefte[0]!, automatisch: 0, handmatig: 0, totaal: 0 },
    ];
    const evenement = maakEvenement();
    const productie = berekenEvenementProductie(evenement, lookup.producten, context);

    const picking = maakPaklijst(productie, leeg);

    expect(picking.regels.every((regel) => regel.soort === 'voedsel')).toBe(true);
  });

  it('start met status open', () => {
    expect(maakLijst().picking.status).toBe('open');
  });

  it('vinkt een regel af zonder de invoer te muteren', () => {
    const { picking } = maakLijst();

    const bijgewerkt = vinkRegelAf(picking, 0);

    expect(bijgewerkt.regels[0]?.afgevinkt).toBe(true);
    expect(picking.regels[0]?.afgevinkt).toBe(false);
    expect(bijgewerkt).not.toBe(picking);
  });

  it('tooglet een regel weer open bij een tweede keer afvinken', () => {
    const { picking } = maakLijst();

    const resultaat = vinkRegelAf(vinkRegelAf(picking, 0), 0);

    expect(resultaat.regels[0]?.afgevinkt).toBe(false);
  });

  it('is pas compleet als alle regels zijn afgevinkt', () => {
    const { picking } = maakLijst();

    const alles = picking.regels.reduce<Picking>(
      (huidige, _regel, index) => vinkRegelAf(huidige, index),
      picking,
    );

    expect(isPaklijstCompleet(picking)).toBe(false);
    expect(isPaklijstCompleet(alles)).toBe(true);
  });
});

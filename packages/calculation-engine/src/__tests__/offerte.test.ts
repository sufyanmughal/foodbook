import { describe, expect, it } from 'vitest';
import { maakOfferteSnapshot, nieuweOfferteVersie } from '../offerte';
import { lookup, maakEvenement } from './fixtures';

const opties = { versie: 1, geldigTot: '2026-07-20' };

function maakSnapshot(overschrijf: Parameters<typeof maakEvenement>[0] = {}) {
  return maakOfferteSnapshot(
    maakEvenement(overschrijf),
    lookup.producten,
    lookup.recepten,
    lookup.btwTarieven,
    opties,
  );
}

describe('offertesnapshot (§3.10)', () => {
  it('bevriest de regels met berekende prijzen', () => {
    const offerte = maakSnapshot();

    expect(offerte.regels.map((regel) => [regel.productNaam, regel.regelTotaalExcl])).toEqual([
      ['Zalmfilet met roomsaus', 1850],
      ['Gepofte krielaardappel', 375],
      ['Huiswijn rood', 450],
    ]);
  });

  it('berekent subtotaal, btw per tarief en totaal', () => {
    const offerte = maakSnapshot();

    expect(offerte.subtotaal).toBe(2675);
    expect(offerte.btwTotaal).toBe(294.75);
    expect(offerte.totaal).toBe(2969.75);
    expect(offerte.btwUitsplitsing.map((regel) => regel.percentage)).toEqual([9, 21]);
  });

  it('neemt de effectieve gastenaantallen per regel over', () => {
    const offerte = maakSnapshot({
      producten: [
        { product: 'prod-zalm' },
        { product: 'prod-wijn', aantalGastenOverride: 40 },
      ],
    });

    expect(offerte.regels.map((regel) => regel.aantalGasten)).toEqual([100, 40]);
    expect(offerte.regels[1]?.regelTotaalExcl).toBe(180);
  });

  it('neemt de effectieve hoeveelheid per persoon over in de bevroren regel', () => {
    const offerte = maakSnapshot({
      producten: [{ product: 'prod-zalm', hoeveelheidPerPersoonOverride: 160 }],
    });

    expect(offerte.regels[0]?.hoeveelheidPerPersoon).toBe(160);
    expect(offerte.regels[0]?.regelTotaalExcl).toBe(1850);
  });

  it('verandert een verzonden offerte niet met terugwerkende kracht (§4.2)', () => {
    const verzonden = maakSnapshot();

    const nieuwePrijsProducten = {
      ...lookup.producten,
      'prod-zalm': { ...lookup.producten['prod-zalm']!, prijsPerPersoon: 99 },
    };
    const nieuweOfferte = maakOfferteSnapshot(
      maakEvenement(),
      nieuwePrijsProducten,
      lookup.recepten,
      lookup.btwTarieven,
      { versie: 2, geldigTot: '2026-08-20' },
    );

    expect(verzonden.regels[0]?.prijsPerPersoon).toBe(18.5);
    expect(verzonden.totaal).toBe(2969.75);
    expect(nieuweOfferte.regels[0]?.prijsPerPersoon).toBe(99);
    expect(nieuweOfferte.subtotaal).toBe(10725);
    expect(nieuweOfferte.totaal).toBe(11744.25);
  });

  it('start als concept met de opgegeven geldigheidsdatum', () => {
    const offerte = maakSnapshot();

    expect(offerte.status).toBe('concept');
    expect(offerte.geldigTot).toBe('2026-07-20');
    expect(offerte.versie).toBe(1);
  });

  it('verhoogt het versienummer voor een nieuwe versie', () => {
    const offerte = maakSnapshot();

    expect(nieuweOfferteVersie({ ...offerte, id: 'off-1' })).toBe(2);
  });
});

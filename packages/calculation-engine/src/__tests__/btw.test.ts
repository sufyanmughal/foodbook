import { describe, expect, it } from 'vitest';
import { berekenTotalen } from '../btw';
import { RekenFout } from '../errors';
import { lookup } from './fixtures';

describe('btw-uitsplitsing (§3.10/§3.16)', () => {
  it('splitst de btw per tarief uit', () => {
    const totalen = berekenTotalen(
      [
        { bedragExcl: 1850, btwTarief: 'btw-laag' },
        { bedragExcl: 375, btwTarief: 'btw-laag' },
        { bedragExcl: 450, btwTarief: 'btw-hoog' },
      ],
      lookup.btwTarieven,
    );

    expect(totalen.subtotaal).toBe(2675);
    expect(totalen.btwTotaal).toBe(294.75);
    expect(totalen.totaal).toBe(2969.75);
    expect(totalen.btwUitsplitsing).toEqual([
      { btwTarief: 'btw-laag', naam: 'Laag (9%)', percentage: 9, grondslag: 2225, btwBedrag: 200.25 },
      { btwTarief: 'btw-hoog', naam: 'Hoog (21%)', percentage: 21, grondslag: 450, btwBedrag: 94.5 },
    ]);
  });

  it('groepeert regels met hetzelfde tarief tot één uitsplitsingsregel', () => {
    const totalen = berekenTotalen(
      [
        { bedragExcl: 100, btwTarief: 'btw-laag' },
        { bedragExcl: 200, btwTarief: 'btw-laag' },
      ],
      lookup.btwTarieven,
    );

    expect(totalen.btwUitsplitsing).toHaveLength(1);
    expect(totalen.btwUitsplitsing[0]?.grondslag).toBe(300);
    expect(totalen.btwUitsplitsing[0]?.btwBedrag).toBe(27);
  });

  it('sorteert de uitsplitsing op oplopend percentage', () => {
    const totalen = berekenTotalen(
      [
        { bedragExcl: 100, btwTarief: 'btw-hoog' },
        { bedragExcl: 100, btwTarief: 'btw-laag' },
      ],
      lookup.btwTarieven,
    );

    expect(totalen.btwUitsplitsing.map((regel) => regel.percentage)).toEqual([9, 21]);
  });

  it('geeft een leeg resultaat zonder regels', () => {
    const totalen = berekenTotalen([], lookup.btwTarieven);

    expect(totalen.subtotaal).toBe(0);
    expect(totalen.btwTotaal).toBe(0);
    expect(totalen.totaal).toBe(0);
    expect(totalen.btwUitsplitsing).toEqual([]);
  });

  it('weigert een onbekend btw-tarief', () => {
    expect(() => berekenTotalen([{ bedragExcl: 100, btwTarief: 'bestaat-niet' }], lookup.btwTarieven)).toThrow(
      RekenFout,
    );
  });
});

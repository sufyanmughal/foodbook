import { describe, expect, it } from 'vitest';
import type { Factuur } from '@foodbook/shared-types';
import { RekenFout } from '../errors';
import {
  bepaalVolgendFactuurNummer,
  datumPlusDagen,
  isTeLaat,
  maakFactuurSnapshot,
} from '../factuur';
import { maakOfferteSnapshot } from '../offerte';
import { lookup, maakEvenement } from './fixtures';

function maakGeaccepteerdeOfferte() {
  const snapshot = maakOfferteSnapshot(
    maakEvenement(),
    lookup.producten,
    lookup.recepten,
    lookup.btwTarieven,
    { versie: 1, geldigTot: '2026-07-20' },
  );
  return { ...snapshot, id: 'off-1', status: 'geaccepteerd' as const };
}

describe('factuurnummering (§3.16)', () => {
  it('begint bij 0001 zonder bestaande facturen', () => {
    expect(bepaalVolgendFactuurNummer([], { prefix: 'F', jaar: 2026 })).toBe('F2026-0001');
  });

  it('loopt op vanaf het hoogste bestaande nummer', () => {
    expect(bepaalVolgendFactuurNummer(['F2026-0001', 'F2026-0002'], { prefix: 'F', jaar: 2026 })).toBe(
      'F2026-0003',
    );
  });

  it('hergebruikt nooit een nummer na een gat', () => {
    expect(bepaalVolgendFactuurNummer(['F2026-0001', 'F2026-0005'], { prefix: 'F', jaar: 2026 })).toBe(
      'F2026-0006',
    );
  });

  it('negeert nummers van een ander jaar', () => {
    expect(bepaalVolgendFactuurNummer(['F2025-0099'], { prefix: 'F', jaar: 2026 })).toBe('F2026-0001');
  });

  it('negeert nummers met een andere prefix', () => {
    expect(bepaalVolgendFactuurNummer(['C2026-0012'], { prefix: 'F', jaar: 2026 })).toBe('F2026-0001');
  });

  it('negeert onleesbare nummers', () => {
    expect(
      bepaalVolgendFactuurNummer(['F2026-0002', 'onzin', ''], { prefix: 'F', jaar: 2026 }),
    ).toBe('F2026-0003');
  });

  it('gaat correct om met speciale tekens in de prefix', () => {
    expect(bepaalVolgendFactuurNummer(['F.2026-0002'], { prefix: 'F.', jaar: 2026 })).toBe(
      'F.2026-0003',
    );
  });
});

describe('datumrekenen', () => {
  it('telt dagen op binnen dezelfde maand', () => {
    expect(datumPlusDagen('2026-06-25', 14)).toBe('2026-07-09');
  });

  it('telt over een maandeinde heen', () => {
    expect(datumPlusDagen('2026-01-31', 14)).toBe('2026-02-14');
  });

  it('telt over een jaareinde heen', () => {
    expect(datumPlusDagen('2026-12-20', 14)).toBe('2027-01-03');
  });

  it('weigert een ongeldige datum', () => {
    expect(() => datumPlusDagen('geen-datum', 1)).toThrow(RekenFout);
  });
});

describe('factuursnapshot (§3.16)', () => {
  it('neemt de geaccepteerde offerteregels bevroren over', () => {
    const factuur = maakFactuurSnapshot(maakGeaccepteerdeOfferte(), lookup.btwTarieven, {
      order: 'ord-1',
      factuurnummer: 'F2026-0001',
      factuurdatum: '2026-06-25',
      betalingstermijnDagen: 30,
    });

    expect(factuur.regels).toHaveLength(3);
    expect(factuur.subtotaal).toBe(2675);
    expect(factuur.btwTotaal).toBe(294.75);
    expect(factuur.totaal).toBe(2969.75);
  });

  it('splitst de btw per tarief uit op de factuur', () => {
    const factuur = maakFactuurSnapshot(maakGeaccepteerdeOfferte(), lookup.btwTarieven, {
      order: 'ord-1',
      factuurnummer: 'F2026-0001',
      factuurdatum: '2026-06-25',
      betalingstermijnDagen: 30,
    });

    expect(factuur.btwUitsplitsing).toEqual([
      { btwTarief: 'btw-laag', naam: 'Laag (9%)', percentage: 9, grondslag: 2225, btwBedrag: 200.25 },
      { btwTarief: 'btw-hoog', naam: 'Hoog (21%)', percentage: 21, grondslag: 450, btwBedrag: 94.5 },
    ]);
  });

  it('berekent de vervaldatum uit de betalingstermijn', () => {
    const factuur = maakFactuurSnapshot(maakGeaccepteerdeOfferte(), lookup.btwTarieven, {
      order: 'ord-1',
      factuurnummer: 'F2026-0001',
      factuurdatum: '2026-06-25',
      betalingstermijnDagen: 30,
    });

    expect(factuur.vervaldatum).toBe('2026-07-25');
  });

  it('start als concept en kan aan een creditfactuur gekoppeld worden', () => {
    const factuur = maakFactuurSnapshot(maakGeaccepteerdeOfferte(), lookup.btwTarieven, {
      order: 'ord-1',
      factuurnummer: 'F2026-0002',
      factuurdatum: '2026-06-25',
      betalingstermijnDagen: 30,
      creditVan: 'fact-1',
    });

    expect(factuur.status).toBe('concept');
    expect(factuur.creditVan).toBe('fact-1');
  });

  it('weigert een factuur van een lege offerte', () => {
    const leeg = { ...maakGeaccepteerdeOfferte(), regels: [] };

    expect(() =>
      maakFactuurSnapshot(leeg, lookup.btwTarieven, {
        order: 'ord-1',
        factuurnummer: 'F2026-0001',
        factuurdatum: '2026-06-25',
        betalingstermijnDagen: 30,
      }),
    ).toThrow(RekenFout);
  });
});

describe('openstaande facturen (§3.16)', () => {
  function maakFactuur(overschrijf: Partial<Factuur>): Factuur {
    return {
      id: 'fact-1',
      order: 'ord-1',
      factuurnummer: 'F2026-0001',
      factuurdatum: '2026-06-25',
      vervaldatum: '2026-07-25',
      regels: [],
      btwUitsplitsing: [],
      subtotaal: 0,
      btwTotaal: 0,
      totaal: 0,
      status: 'verzonden',
      ...overschrijf,
    };
  }

  it('markeert een factuur na de vervaldatum als te laat', () => {
    expect(isTeLaat(maakFactuur({}), '2026-08-01')).toBe(true);
  });

  it('markeert een factuur voor de vervaldatum niet als te laat', () => {
    expect(isTeLaat(maakFactuur({}), '2026-07-01')).toBe(false);
  });

  it('markeert een betaalde factuur nooit als te laat', () => {
    expect(isTeLaat(maakFactuur({ status: 'betaald' }), '2026-12-01')).toBe(false);
  });
});

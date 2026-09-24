import {
  EENHEDEN,
  EVENT_STATUS,
  FACTUUR_STATUS,
  LEVERING_STATUS,
  OFFERTE_STATUS,
  ORDER_STATUS,
  ROLLEN,
} from '@foodbook/shared-types';
import { describe, expect, it } from 'vitest';
import {
  CATALOGI,
  I18nFout,
  eenheidLabel,
  evenementStatusLabel,
  factuurStatusLabel,
  formatteerBedrag,
  formatteerDatum,
  formatteerDatumKort,
  formatteerHoeveelheid,
  formatteerMaand,
  leveringStatusLabel,
  offerteStatusLabel,
  orderStatusLabel,
  rolLabel,
  t,
} from '../index';

describe('messages (t)', () => {
  it('looks up a message by its path', () => {
    expect(t('algemeen.opslaan')).toBe('Save');
    expect(t('documenten.allergenenlijst')).toBe('Allergen list');
  });

  it('fills in placeholders', () => {
    expect(t('documentKoppen.offerteVoor', { klant: 'Bruiloft Jansen' })).toBe(
      'Quotation for Bruiloft Jansen',
    );
    expect(t('documentKoppen.aantalGasten', { aantal: 100 })).toBe('Number of guests: 100');
  });

  it('fills in multiple placeholders', () => {
    expect(t('documentKoppen.inkooplijstPeriode', { van: '1 June', tot: '30 June' })).toBe(
      'Purchase list 1 June to 30 June',
    );
  });

  it('throws on an unknown path', () => {
    expect(() => t('bestaat.niet' as never)).toThrow(I18nFout);
  });

  it('throws when a parameter is missing', () => {
    expect(() => t('documentKoppen.offerteVoor')).toThrow(I18nFout);
  });
});

describe('catalogues', () => {
  it('has the same keys in every language', () => {
    const paden = (object: unknown, voorvoegsel = ''): string[] =>
      Object.entries(object as Record<string, unknown>).flatMap(([sleutel, waarde]) =>
        typeof waarde === 'string'
          ? [`${voorvoegsel}${sleutel}`]
          : paden(waarde, `${voorvoegsel}${sleutel}.`),
      );

    expect(paden(CATALOGI.en).sort()).toEqual(paden(CATALOGI.nl).sort());
  });

  it('has no empty messages in either language', () => {
    const leeg = (object: unknown, voorvoegsel = ''): string[] =>
      Object.entries(object as Record<string, unknown>).flatMap(([sleutel, waarde]) =>
        typeof waarde === 'string'
          ? waarde.trim() === ''
            ? [`${voorvoegsel}${sleutel}`]
            : []
          : leeg(waarde, `${voorvoegsel}${sleutel}.`),
      );

    expect(leeg(CATALOGI.en)).toEqual([]);
    expect(leeg(CATALOGI.nl)).toEqual([]);
  });
});

describe('labels cover every enum value', () => {
  it('covers every role', () => {
    for (const rol of ROLLEN) {
      expect(rolLabel(rol).length).toBeGreaterThan(0);
    }
  });

  it('covers every status in every workflow', () => {
    for (const status of EVENT_STATUS) expect(evenementStatusLabel(status).length).toBeGreaterThan(0);
    for (const status of OFFERTE_STATUS) expect(offerteStatusLabel(status).length).toBeGreaterThan(0);
    for (const status of ORDER_STATUS) expect(orderStatusLabel(status).length).toBeGreaterThan(0);
    for (const status of LEVERING_STATUS) expect(leveringStatusLabel(status).length).toBeGreaterThan(0);
    for (const status of FACTUUR_STATUS) expect(factuurStatusLabel(status).length).toBeGreaterThan(0);
  });

  it('covers every unit', () => {
    for (const eenheid of EENHEDEN) {
      expect(eenheidLabel(eenheid).length).toBeGreaterThan(0);
    }
  });

  it('has a label for every unit in every catalogue', () => {
    expect(Object.keys(CATALOGI.en.eenheden).sort()).toEqual([...EENHEDEN].sort());
    expect(Object.keys(CATALOGI.nl.eenheden).sort()).toEqual([...EENHEDEN].sort());
  });
});

describe('formatting (default locale: en-GB)', () => {
  it('formats amounts as euro currency', () => {
    const bedrag = formatteerBedrag(1234.5);

    expect(bedrag).toContain('1,234.50');
    expect(bedrag).toContain('€');
  });

  it('rounds amounts to euro cents', () => {
    expect(formatteerBedrag(2969.755)).toContain('2,969.76');
  });

  it('formats a date in words', () => {
    expect(formatteerDatum('2026-06-20')).toBe('20 June 2026');
  });

  it('formats a short date', () => {
    expect(formatteerDatumKort('2026-06-20')).toBe('20/06/2026');
  });

  it('formats a month and year', () => {
    expect(formatteerMaand('2026-06-20')).toBe('June 2026');
  });

  it('formats quantities with their unit', () => {
    expect(formatteerHoeveelheid(2.3, 'kg')).toBe('2.3 kg');
    expect(formatteerHoeveelheid(18000, 'gram')).toBe('18,000 gram');
  });

  it('rejects an invalid date', () => {
    expect(() => formatteerDatum('geen-datum')).toThrow(I18nFout);
  });
});

describe('formatting in Dutch (explicit locale)', () => {
  it('formats amounts the Dutch way', () => {
    expect(formatteerBedrag(1234.5, 'nl')).toContain('1.234,50');
  });

  it('formats dates the Dutch way', () => {
    expect(formatteerDatum('2026-06-20', 'nl')).toBe('20 juni 2026');
    expect(formatteerDatumKort('2026-06-20', 'nl')).toBe('20-06-2026');
  });

  it('formats quantities the Dutch way', () => {
    expect(formatteerHoeveelheid(2.3, 'kg', 'nl')).toBe('2,3 kg');
  });
});

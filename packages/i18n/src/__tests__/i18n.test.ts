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

describe('berichten (t)', () => {
  it('haalt een bericht op via zijn pad', () => {
    expect(t('algemeen.opslaan')).toBe('Opslaan');
    expect(t('documenten.allergenenlijst')).toBe('Allergenenlijst');
  });

  it('vult placeholders in', () => {
    expect(t('documentKoppen.offerteVoor', { klant: 'Bruiloft Jansen' })).toBe(
      'Offerte voor Bruiloft Jansen',
    );
    expect(t('documentKoppen.aantalGasten', { aantal: 100 })).toBe('Aantal gasten: 100');
  });

  it('vult meerdere placeholders in', () => {
    expect(t('documentKoppen.inkooplijstPeriode', { van: '1 juni', tot: '30 juni' })).toBe(
      'Inkooplijst 1 juni tot 30 juni',
    );
  });

  it('gooit een fout bij een onbekend pad', () => {
    expect(() => t('bestaat.niet' as never)).toThrow(I18nFout);
  });

  it('gooit een fout wanneer een parameter ontbreekt', () => {
    expect(() => t('documentKoppen.offerteVoor')).toThrow(I18nFout);
  });
});

describe('labels dekken alle enumwaarden', () => {
  it('dekt alle rollen', () => {
    for (const rol of ROLLEN) {
      expect(rolLabel(rol).length).toBeGreaterThan(0);
    }
  });

  it('dekt alle statussen van elke workflow', () => {
    for (const status of EVENT_STATUS) expect(evenementStatusLabel(status).length).toBeGreaterThan(0);
    for (const status of OFFERTE_STATUS) expect(offerteStatusLabel(status).length).toBeGreaterThan(0);
    for (const status of ORDER_STATUS) expect(orderStatusLabel(status).length).toBeGreaterThan(0);
    for (const status of LEVERING_STATUS) expect(leveringStatusLabel(status).length).toBeGreaterThan(0);
    for (const status of FACTUUR_STATUS) expect(factuurStatusLabel(status).length).toBeGreaterThan(0);
  });

  it('dekt alle eenheden', () => {
    for (const eenheid of EENHEDEN) {
      expect(eenheidLabel(eenheid).length).toBeGreaterThan(0);
    }
  });

  it('heeft voor elke eenheid ook een label in de catalogus', () => {
    expect(Object.keys(CATALOGI.nl.eenheden).sort()).toEqual([...EENHEDEN].sort());
  });
});

describe('formatteren (nl-NL)', () => {
  it('formatteert bedragen als Nederlandse munteenheid', () => {
    const bedrag = formatteerBedrag(1234.5);

    expect(bedrag).toContain('1.234,50');
    expect(bedrag).toContain('€');
  });

  it('rondt bedragen af op eurocenten', () => {
    expect(formatteerBedrag(2969.755)).toContain('2.969,76');
  });

  it('formatteert datum in letters', () => {
    expect(formatteerDatum('2026-06-20')).toBe('20 juni 2026');
  });

  it('formatteert datum kort', () => {
    expect(formatteerDatumKort('2026-06-20')).toBe('20-06-2026');
  });

  it('formatteert een maand en jaar', () => {
    expect(formatteerMaand('2026-06-20')).toBe('juni 2026');
  });

  it('formatteert hoeveelheden met eenheid', () => {
    expect(formatteerHoeveelheid(2.3, 'kg')).toBe('2,3 kg');
    expect(formatteerHoeveelheid(18000, 'gram')).toBe('18.000 gram');
  });

  it('weigert een ongeldige datum', () => {
    expect(() => formatteerDatum('geen-datum')).toThrow(I18nFout);
  });
});

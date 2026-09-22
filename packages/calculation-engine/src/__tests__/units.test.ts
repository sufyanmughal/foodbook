import { describe, expect, it } from 'vitest';
import { RekenFout } from '../errors';
import { basisEenheidVan, converteer, dimensieVan, naarBasis, vanBasis, zijnVerenigbaar } from '../units';

describe('eenheden (§3.1/§3.3)', () => {
  it('herkent de dimensie van een eenheid', () => {
    expect(dimensieVan('gram')).toBe('massa');
    expect(dimensieVan('liter')).toBe('volume');
    expect(dimensieVan('stuk')).toBe('aantal');
  });

  it('geeft de basis-eenheid van de dimensie terug', () => {
    expect(basisEenheidVan('kg')).toBe('gram');
    expect(basisEenheidVan('liter')).toBe('ml');
    expect(basisEenheidVan('stuk')).toBe('stuk');
  });

  it('rekent om naar de basis-eenheid', () => {
    expect(naarBasis(1.5, 'kg')).toBe(1500);
    expect(naarBasis(2, 'liter')).toBe(2000);
    expect(naarBasis(3, 'stuk')).toBe(3);
  });

  it('rekent terug vanuit de basis-eenheid', () => {
    expect(vanBasis(1500, 'kg')).toBe(1.5);
    expect(vanBasis(2000, 'liter')).toBe(2);
  });

  it('rekent rechtstreeks tussen eenheden van dezelfde dimensie om', () => {
    expect(converteer(1, 'kg', 'gram')).toBe(1000);
    expect(converteer(500, 'gram', 'kg')).toBe(0.5);
    expect(converteer(2, 'liter', 'ml')).toBe(2000);
  });

  it('weet welke eenheden verenigbaar zijn', () => {
    expect(zijnVerenigbaar('gram', 'kg')).toBe(true);
    expect(zijnVerenigbaar('ml', 'liter')).toBe(true);
    expect(zijnVerenigbaar('gram', 'ml')).toBe(false);
    expect(zijnVerenigbaar('stuk', 'gram')).toBe(false);
  });

  it('weigert omrekening tussen verschillende dimensies', () => {
    expect(() => converteer(100, 'gram', 'ml')).toThrow(RekenFout);
    expect(() => converteer(1, 'stuk', 'kg')).toThrow(RekenFout);
  });
});

import { describe, expect, it } from 'vitest';
import { inkoopHoeveelheid, productieHoeveelheid, rondGeldAf, rondOpVolledigeStappen } from '../rounding';

describe('afrondingsregels (§4.4)', () => {
  it('rondt inkoop naar boven af op hele inkoopeenheden', () => {
    expect(inkoopHoeveelheid(2300, 'kg')).toBe(3);
    expect(inkoopHoeveelheid(2000, 'kg')).toBe(2);
    expect(inkoopHoeveelheid(2001, 'kg')).toBe(3);
  });

  it('laat een ingrediënt dat per gram wordt ingekocht exact', () => {
    expect(inkoopHoeveelheid(2300, 'gram')).toBe(2300);
  });

  it('rondt stuks naar boven af op hele stuks', () => {
    expect(inkoopHoeveelheid(2.3, 'stuk')).toBe(3);
    expect(inkoopHoeveelheid(2, 'stuk')).toBe(2);
  });

  it('rondt altijd naar boven af op een hele inkoopeenheid', () => {
    expect(inkoopHoeveelheid(0.3, 'liter')).toBe(1);
    expect(inkoopHoeveelheid(0.1 + 0.2, 'liter')).toBe(1);
  });

  it('laat drijvende-komma-artefacten geen extra eenheid opleveren', () => {
    expect(inkoopHoeveelheid(2000.0000000000002, 'kg')).toBe(2);
    expect(inkoopHoeveelheid(3000, 'kg')).toBe(3);
    expect(rondOpVolledigeStappen(1000 * 2, 'kg')).toBe(2000);
  });

  it('geeft nul terug voor een lege of negatieve behoefte', () => {
    expect(inkoopHoeveelheid(0, 'kg')).toBe(0);
    expect(inkoopHoeveelheid(-5, 'kg')).toBe(0);
  });

  it('houdt productie- en keukenhoeveelheden exact', () => {
    expect(productieHoeveelheid(2300, 'kg')).toBeCloseTo(2.3, 9);
    expect(productieHoeveelheid(2300, 'gram')).toBe(2300);
  });

  it('rondt geldbedragen af op eurocenten', () => {
    expect(rondGeldAf(0.1 + 0.2)).toBe(0.3);
    expect(rondGeldAf(2.345)).toBe(2.35);
    expect(rondGeldAf(2.344)).toBe(2.34);
    expect(rondGeldAf(-2.345)).toBe(-2.35);
  });
});

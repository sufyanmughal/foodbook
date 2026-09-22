import { describe, expect, it } from 'vitest';
import { RekenFout } from '../errors';
import { kostprijsVoorHoeveelheid, prijsPerBasiseenheid } from '../kostprijs';
import { lookup } from './fixtures';

describe('kostprijs (§4.2)', () => {
  it('rekent de inkoopprijs om naar de basis-eenheid', () => {
    expect(prijsPerBasiseenheid(lookup.ingredienten['ing-zalm']!)).toBe(0.025);
    expect(prijsPerBasiseenheid(lookup.ingredienten['ing-room']!)).toBe(0.008);
    expect(prijsPerBasiseenheid(lookup.ingredienten['ing-citroen']!)).toBe(0.8);
  });

  it('berekent de kostprijs van een exacte hoeveelheid', () => {
    expect(kostprijsVoorHoeveelheid(lookup.ingredienten['ing-zalm']!, 18000)).toBe(450);
    expect(kostprijsVoorHoeveelheid(lookup.ingredienten['ing-room']!, 300)).toBeCloseTo(2.4, 9);
    expect(kostprijsVoorHoeveelheid(lookup.ingredienten['ing-citroen']!, 2)).toBeCloseTo(1.6, 9);
  });

  it('leidt de verkoopprijs nooit af uit de kostprijs', () => {
    const product = lookup.producten['prod-zalm']!;
    const ingredientKostprijs = kostprijsVoorHoeveelheid(lookup.ingredienten['ing-zalm']!, 1000);

    expect(ingredientKostprijs).toBe(25);
    expect(product.prijsPerPersoon).toBe(18.5);
  });

  it('weigert een negatieve hoeveelheid', () => {
    expect(() => kostprijsVoorHoeveelheid(lookup.ingredienten['ing-zalm']!, -1)).toThrow(RekenFout);
  });
});

import { describe, expect, it } from 'vitest';
import { RekenFout } from '../errors';
import { berekenPorties, schaalRecept } from '../scaling';
import { lookup, maakEvenement } from './fixtures';

describe('berekenPorties (§4.1)', () => {
  it('schaalt het recept als geschreven wanneer er niets is overschreven', () => {
    const evenement = maakEvenement();
    const product = lookup.producten['prod-zalm']!;
    const recept = lookup.recepten['rec-zalm']!;

    const porties = berekenPorties(product, evenement.producten[0], evenement, recept);

    expect(porties.aantalGasten).toBe(100);
    expect(porties.hoeveelheidPerPersoon).toBe(180);
    expect(porties.productHoeveelheid).toBe(18000);
    expect(porties.schaal).toBe(10);
  });

  it('geeft schaal 1 voor een product zonder recept', () => {
    const evenement = maakEvenement();
    const product = lookup.producten['prod-aardappel']!;

    const porties = berekenPorties(product, evenement.producten[1], evenement);

    expect(porties.schaal).toBe(1);
    expect(porties.productHoeveelheid).toBe(20000);
  });

  it('laat de ingrediënten meeschalen als het gastenaantal wijzigt (§4.2)', () => {
    const product = lookup.producten['prod-zalm']!;
    const recept = lookup.recepten['rec-zalm']!;
    const evenement = maakEvenement({ aantalGasten: 80 });

    const porties = berekenPorties(product, evenement.producten[0], evenement, recept);
    const geschaald = schaalRecept(recept, porties.schaal, lookup.ingredienten);

    expect(geschaald.find((r) => r.ingredient === 'ing-zalm')?.hoeveelheid).toBe(14400);
  });

  it('respecteert een aantalGastenOverride per regel (gerecht voor een subset)', () => {
    const product = lookup.producten['prod-zalm']!;
    const recept = lookup.recepten['rec-zalm']!;
    const evenement = maakEvenement({
      producten: [{ product: 'prod-zalm', aantalGastenOverride: 40 }],
    });

    const porties = berekenPorties(product, evenement.producten[0], evenement, recept);
    const geschaald = schaalRecept(recept, porties.schaal, lookup.ingredienten);

    expect(porties.aantalGasten).toBe(40);
    expect(geschaald.find((r) => r.ingredient === 'ing-zalm')?.hoeveelheid).toBe(7200);
  });

  it('laat de ingrediënten meeschalen bij een hoeveelheidPerPersoonOverride', () => {
    const product = lookup.producten['prod-zalm']!;
    const recept = lookup.recepten['rec-zalm']!;
    const evenement = maakEvenement({
      producten: [{ product: 'prod-zalm', hoeveelheidPerPersoonOverride: 160 }],
    });

    const porties = berekenPorties(product, evenement.producten[0], evenement, recept);
    const geschaald = schaalRecept(recept, porties.schaal, lookup.ingredienten);

    expect(geschaald.find((r) => r.ingredient === 'ing-zalm')?.hoeveelheid).toBe(16000);
    expect(geschaald.find((r) => r.ingredient === 'ing-room')?.hoeveelheid).toBeCloseTo(2666.667, 3);
  });

  it('herberekent open evenementen als de productstandaard van 180g naar 160g gaat (§4.2)', () => {
    const recept = lookup.recepten['rec-zalm']!;
    const evenement = maakEvenement();
    const gewijzigdProduct = { ...lookup.producten['prod-zalm']!, hoeveelheidPerPersoon: 160 };

    const porties = berekenPorties(gewijzigdProduct, evenement.producten[0], evenement, recept);
    const geschaald = schaalRecept(recept, porties.schaal, lookup.ingredienten);

    expect(geschaald.find((r) => r.ingredient === 'ing-zalm')?.hoeveelheid).toBe(16000);
    expect(geschaald.find((r) => r.ingredient === 'ing-citroen')?.hoeveelheid).toBeCloseTo(17.778, 3);
  });

  it('normaliseert recepteenheden naar de basis-eenheid van de dimensie', () => {
    const recept = { ...lookup.recepten['rec-zalm']!, ingredienten: [{ ingredient: 'ing-zalm', hoeveelheid: 1.8, eenheid: 'kg' as const }] };

    const geschaald = schaalRecept(recept, 10, lookup.ingredienten);

    expect(geschaald[0]?.hoeveelheid).toBe(18000);
    expect(geschaald[0]?.basisEenheid).toBe('gram');
  });

  it('weigert een ongeldig gastenaantal', () => {
    const product = lookup.producten['prod-zalm']!;
    const evenement = maakEvenement({ aantalGasten: -1 });

    expect(() => berekenPorties(product, evenement.producten[0], evenement)).toThrow(RekenFout);
  });

  it('weigert een hoeveelheid per persoon van nul', () => {
    const evenement = maakEvenement({
      producten: [{ product: 'prod-zalm', hoeveelheidPerPersoonOverride: 0 }],
    });

    expect(() =>
      berekenPorties(lookup.producten['prod-zalm']!, evenement.producten[0], evenement),
    ).toThrow(RekenFout);
  });

  it('weigert een recept met een ongeldige standaardportie', () => {
    const kapotRecept = { ...lookup.recepten['rec-zalm']!, hoeveelheidPerPersoon: 0 };
    const evenement = maakEvenement();

    expect(() =>
      berekenPorties(lookup.producten['prod-zalm']!, evenement.producten[0], evenement, kapotRecept),
    ).toThrow(RekenFout);
  });

  it('weigert een receptregel die niet bij de inkoopeenheid past', () => {
    const kapotRecept = {
      ...lookup.recepten['rec-zalm']!,
      ingredienten: [{ ingredient: 'ing-zalm', hoeveelheid: 10, eenheid: 'stuk' as const }],
    };

    expect(() => schaalRecept(kapotRecept, 10, lookup.ingredienten)).toThrow(RekenFout);
  });
});

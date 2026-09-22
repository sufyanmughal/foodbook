import { describe, expect, it } from 'vitest';
import { berekenEvenementProductie } from '../productie';
import { lookup, maakEvenement } from './fixtures';

const context = { recepten: lookup.recepten, ingredienten: lookup.ingredienten };

describe('productie-explosie (§3.12)', () => {
  it('explodeert een product via zijn recept naar geschaalde ingrediëntregels', () => {
    const productie = berekenEvenementProductie(maakEvenement(), lookup.producten, context);
    const zalm = productie.regels.find((regel) => regel.product === 'prod-zalm')!;

    expect(zalm.receptNaam).toBe('Zalmfilet met roomsaus');
    expect(zalm.keukenstation).toBe('Warme keuken');
    expect(zalm.aantalGasten).toBe(100);
    expect(zalm.productHoeveelheid).toBe(18000);
    expect(zalm.ingredienten.map((regel) => [regel.naam, regel.hoeveelheid])).toEqual([
      ['Zalmfilet', 18000],
      ['Room', 3000],
      ['Boter', 1000],
      ['Citroen', 20],
    ]);
  });

  it('berekent de kostprijs per regel uit de ingrediëntprijzen', () => {
    const productie = berekenEvenementProductie(maakEvenement(), lookup.producten, context);
    const zalm = productie.regels.find((regel) => regel.product === 'prod-zalm')!;

    expect(zalm.kostprijs).toBe(502);
  });

  it('laat een product zonder recept als productregel staan zonder ingrediënten', () => {
    const productie = berekenEvenementProductie(maakEvenement(), lookup.producten, context);
    const aardappel = productie.regels.find((regel) => regel.product === 'prod-aardappel')!;

    expect(aardappel.ingredienten).toEqual([]);
    expect(aardappel.productHoeveelheid).toBe(20000);
    expect(aardappel.kostprijs).toBe(0);
  });

  it('telt de ingrediëntbehoefte op over alle regels van het evenement', () => {
    const evenement = maakEvenement({
      producten: [{ product: 'prod-zalm' }, { product: 'prod-zalm' }],
    });

    const productie = berekenEvenementProductie(evenement, lookup.producten, context);

    expect(productie.ingredientTotalen.find((regel) => regel.naam === 'Zalmfilet')?.hoeveelheid).toBe(
      36000,
    );
  });

  it('sorteert de ingrediënttotalen op naam', () => {
    const productie = berekenEvenementProductie(maakEvenement(), lookup.producten, context);

    expect(productie.ingredientTotalen.map((regel) => regel.naam)).toEqual([
      'Boter',
      'Citroen',
      'Room',
      'Zalmfilet',
    ]);
  });

  it('volgt een wijziging van het gastenaantal direct (§4.2)', () => {
    const productie = berekenEvenementProductie(maakEvenement({ aantalGasten: 50 }), lookup.producten, context);

    expect(productie.ingredientTotalen.find((regel) => regel.naam === 'Zalmfilet')?.hoeveelheid).toBe(
      9000,
    );
  });
});

import { describe, expect, it } from 'vitest';
import { RekenFout } from '../errors';
import { berekenMaterialen } from '../materialen';
import { lookup, maakEvenement } from './fixtures';

const bord = {
  id: 'mat-bord',
  naam: 'Dinerbord',
  eenheid: 'stuk' as const,
  voorraadBeheerd: true,
  huurprijs: 0.5,
};

const warmhoudplaat = {
  id: 'mat-warmhoudplaat',
  naam: 'Warmhoudplaat',
  eenheid: 'stuk' as const,
  voorraadBeheerd: true,
  huurprijs: 12.5,
};

const bestek = {
  id: 'mat-bestek',
  naam: 'Bestekset',
  eenheid: 'stuk' as const,
  voorraadBeheerd: false,
};

const materialen = {
  'mat-bord': bord,
  'mat-warmhoudplaat': warmhoudplaat,
  'mat-bestek': bestek,
};

// Een product met een bord per gast en een warmhoudplaat per vijftig gasten.
const productMetMateriaal = {
  ...lookup.producten['prod-zalm']!,
  materialen: [
    { materiaal: 'mat-bord', hoeveelheid: 1, perAantalGasten: 1 },
    { materiaal: 'mat-warmhoudplaat', hoeveelheid: 1, perAantalGasten: 50 },
  ],
};

const producten = { ...lookup.producten, 'prod-zalm': productMetMateriaal };

describe('materialen per gast (B14)', () => {
  it('rekent materiaal per gast mee met het aantal gasten', () => {
    const evenement = maakEvenement({ aantalGasten: 250, materialen: [] });

    const behoefte = berekenMaterialen(evenement, producten, materialen);
    const borden = behoefte.find((regel) => regel.materiaal === 'mat-bord');

    expect(borden?.automatisch).toBe(250);
    expect(borden?.totaal).toBe(250);
    expect(borden?.herkomst).toEqual(['Zalmfilet met roomsaus']);
  });

  it('rondt materiaal naar boven af op hele stuks', () => {
    const evenement = maakEvenement({ aantalGasten: 120, materialen: [] });

    const behoefte = berekenMaterialen(evenement, producten, materialen);
    const platen = behoefte.find((regel) => regel.materiaal === 'mat-warmhoudplaat');

    // 120 gasten ÷ 50 = 2,4 → 3 warmhoudplaten; eentje te weinig is erger dan eentje te veel.
    expect(platen?.automatisch).toBe(3);
  });

  it('telt automatisch en handmatig bij elkaar op', () => {
    const evenement = maakEvenement({
      aantalGasten: 100,
      materialen: [
        { materiaal: 'mat-bord', aantal: 10 },
        { materiaal: 'mat-bestek', aantal: 100 },
      ],
    });

    const behoefte = berekenMaterialen(evenement, producten, materialen);

    expect(behoefte.find((regel) => regel.materiaal === 'mat-bord')).toMatchObject({
      automatisch: 100,
      handmatig: 10,
      totaal: 110,
    });
    expect(behoefte.find((regel) => regel.materiaal === 'mat-bestek')).toMatchObject({
      automatisch: 0,
      handmatig: 100,
      totaal: 100,
    });
  });

  it('neemt materiaal op dat alleen handmatig is toegevoegd', () => {
    const evenement = maakEvenement({
      aantalGasten: 50,
      materialen: [{ materiaal: 'mat-bestek', aantal: 50 }],
    });

    const behoefte = berekenMaterialen(evenement, producten, materialen);

    expect(behoefte.map((regel) => regel.naam)).toEqual(['Bestekset', 'Dinerbord', 'Warmhoudplaat']);
  });

  it('volgt een gastenoverride per regel, net als het eten', () => {
    const evenement = maakEvenement({
      aantalGasten: 250,
      materialen: [],
      producten: [{ product: 'prod-zalm', aantalGastenOverride: 40 }],
    });

    const behoefte = berekenMaterialen(evenement, producten, materialen);
    const borden = behoefte.find((regel) => regel.materiaal === 'mat-bord');

    // Alleen de 40 gasten van dit gerecht vragen om een bord uit deze regel.
    expect(borden?.automatisch).toBe(40);
  });

  it('herberekent mee als het gastenaantal wijzigt', () => {
    const met250 = berekenMaterialen(maakEvenement({ aantalGasten: 250, materialen: [] }), producten, materialen);
    const met300 = berekenMaterialen(maakEvenement({ aantalGasten: 300, materialen: [] }), producten, materialen);

    expect(met250.find((r) => r.materiaal === 'mat-bord')?.automatisch).toBe(250);
    expect(met300.find((r) => r.materiaal === 'mat-bord')?.automatisch).toBe(300);
  });

  it('telt materiaal van meerdere gerechten op', () => {
    const tweeProducten = {
      ...producten,
      'prod-aardappel': {
        ...lookup.producten['prod-aardappel']!,
        materialen: [{ materiaal: 'mat-bord', hoeveelheid: 1, perAantalGasten: 1 }],
      },
    };

    const behoefte = berekenMaterialen(
      maakEvenement({ aantalGasten: 100, materialen: [] }),
      tweeProducten,
      materialen,
    );

    expect(behoefte.find((regel) => regel.materiaal === 'mat-bord')).toMatchObject({
      automatisch: 200,
      herkomst: ['Gepofte krielaardappel', 'Zalmfilet met roomsaus'],
    });
  });

  it('laat materialen weg die nergens bij horen', () => {
    const behoefte = berekenMaterialen(
      maakEvenement({ aantalGasten: 100, materialen: [] }),
      lookup.producten,
      materialen,
    );

    expect(behoefte).toEqual([]);
  });

  it('weigert een ongeldig aantal gasten per materiaal', () => {
    const kapot = {
      ...producten,
      'prod-zalm': {
        ...productMetMateriaal,
        materialen: [{ materiaal: 'mat-bord', hoeveelheid: 1, perAantalGasten: 0 }],
      },
    };

    expect(() =>
      berekenMaterialen(maakEvenement({ aantalGasten: 100, materialen: [] }), kapot, materialen),
    ).toThrow(RekenFout);
  });

  it('weigert een negatieve materiaalhoeveelheid', () => {
    const kapot = {
      ...producten,
      'prod-zalm': {
        ...productMetMateriaal,
        materialen: [{ materiaal: 'mat-bord', hoeveelheid: -1, perAantalGasten: 1 }],
      },
    };

    expect(() =>
      berekenMaterialen(maakEvenement({ aantalGasten: 100, materialen: [] }), kapot, materialen),
    ).toThrow(RekenFout);
  });

  it('weigert een materiaal dat niet bestaat', () => {
    const kapot = {
      ...producten,
      'prod-zalm': {
        ...productMetMateriaal,
        materialen: [{ materiaal: 'bestaat-niet', hoeveelheid: 1, perAantalGasten: 1 }],
      },
    };

    expect(() =>
      berekenMaterialen(maakEvenement({ aantalGasten: 100, materialen: [] }), kapot, materialen),
    ).toThrow(RekenFout);
  });
});

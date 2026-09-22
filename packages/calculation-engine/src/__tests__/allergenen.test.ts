import { describe, expect, it } from 'vitest';
import {
  allergenenDetails,
  allergenenVanProduct,
  allergenenVanRecept,
  productenZonderAllergenenInfo,
} from '../allergenen';
import { allergenen, lookup } from './fixtures';

describe('allergenen-propagatie (§4.3)', () => {
  it('leidt de allergenen van een recept af uit zijn ingrediënten', () => {
    expect(allergenenVanRecept(lookup.recepten['rec-zalm']!, lookup.ingredienten)).toEqual([
      'all-melk',
      'all-vis',
    ]);
  });

  it('leidt de allergenen van een product af uit het recept', () => {
    expect(
      allergenenVanProduct(lookup.producten['prod-zalm']!, lookup.recepten, lookup.ingredienten),
    ).toEqual(['all-melk', 'all-vis']);
  });

  it('gebruikt directe tags voor een product zonder recept', () => {
    expect(
      allergenenVanProduct(lookup.producten['prod-aardappel']!, lookup.recepten, lookup.ingredienten),
    ).toEqual(['all-selderij']);
  });

  it('uniet directe tags met de allergenen uit het recept', () => {
    const metExtraTag = {
      ...lookup.producten['prod-zalm']!,
      allergenen: ['all-gluten', 'all-vis'],
    };

    expect(allergenenVanProduct(metExtraTag, lookup.recepten, lookup.ingredienten)).toEqual([
      'all-gluten',
      'all-melk',
      'all-vis',
    ]);
  });

  it('herberekent mee wanneer een ingrediënt van allergenen verandert', () => {
    const zonderVis = {
      ...lookup.ingredienten,
      'ing-zalm': { ...lookup.ingredienten['ing-zalm']!, allergenen: [] },
    };

    expect(allergenenVanRecept(lookup.recepten['rec-zalm']!, zonderVis)).toEqual(['all-melk']);
  });

  it('geeft volledige allergenenrecords terug, gesorteerd op naam', () => {
    const details = allergenenDetails(['all-vis', 'all-melk'], lookup.allergenen);

    expect(details.map((allergeen) => allergeen.naam)).toEqual(['Melk', 'Vis']);
    expect(details.map((allergeen) => allergeen.wettelijkeCode)).toEqual(['MELK', 'VIS']);
  });

  it('negeert onbekende allergenen-ids zonder te crashen', () => {
    expect(allergenenDetails(['all-vis', 'bestaat-niet'], lookup.allergenen)).toHaveLength(1);
  });

  it('dekt de wettelijke referentielijst met unieke codes', () => {
    const codes = allergenen.map((allergeen) => allergeen.wettelijkeCode);
    expect(new Set(codes).size).toBe(codes.length);
  });
});

describe('ontbrekende allergeneninformatie (B15)', () => {
  it('meldt een product zonder recept én zonder allergenen', () => {
    // Ingekocht artikel waar niets over bekend is: dit mag nooit stilzwijgend als
    // allergeenvrij op een lijst komen.
    const kaal = {
      ...lookup.producten['prod-aardappel']!,
      allergenen: [],
    };

    expect(productenZonderAllergenenInfo([kaal])).toHaveLength(1);
  });

  it('meldt niets bij een product met een recept', () => {
    // Het recept geeft houvast, ook als er toevallig geen allergeen uit volgt.
    expect(productenZonderAllergenenInfo([lookup.producten['prod-zalm']!])).toEqual([]);
  });

  it('meldt niets bij een product met directe allergenen-tags', () => {
    expect(productenZonderAllergenenInfo([lookup.producten['prod-aardappel']!])).toEqual([]);
  });

  it('meldt niets bij een product zonder recept maar met tags', () => {
    const getagd = { ...lookup.producten['prod-wijn']!, allergenen: ['all-sulfiet'] };

    expect(productenZonderAllergenenInfo([getagd])).toEqual([]);
  });

  it('geeft alleen de producten terug waar het speelt', () => {
    const kaal = { ...lookup.producten['prod-wijn']!, allergenen: [] };
    const alle = [
      lookup.producten['prod-zalm']!, // heeft een recept → niet melden
      lookup.producten['prod-aardappel']!, // heeft directe tags → niet melden
      kaal, // ingekocht artikel zonder tags → wel melden
    ];

    expect(productenZonderAllergenenInfo(alle).map((product) => product.id)).toEqual(['prod-wijn']);
  });

  it('meldt een ingekocht artikel zonder tags, ook als het al eerder als allergeenvrij op de lijst stond', () => {
    // Dit is precies het scenario uit de voorbeelddata: wijn en stokbrood zonder tags zouden
    // stilzwijgend als allergeenvrij op de allergenenlijst komen.
    const gevonden = productenZonderAllergenenInfo([lookup.producten['prod-wijn']!]);

    expect(gevonden).toHaveLength(1);
    expect(gevonden[0]?.naam).toBe('Huiswijn rood');
  });
});

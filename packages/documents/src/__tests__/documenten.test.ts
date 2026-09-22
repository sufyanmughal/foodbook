import { berekenEvenementProductie } from '@foodbook/calculation-engine';
import { nl } from '@foodbook/i18n';
import type { Evenement } from '@foodbook/shared-types';
import { DOCUMENT_TYPES, DocumentFout } from '../model';
import { describe, expect, it } from 'vitest';
import {
  maakAllergenenlijstDocument,
  maakFactuurDocument,
  maakInkooplijstDocument,
  maakKeukenlijstDocument,
  maakLeveringslijstDocument,
  maakMaterialenlijstDocument,
  maakOfferteDocument,
  maakOrderbevestigingDocument,
  maakPaklijstDocument,
  maakProductielijstDocument,
} from '../index';
import {
  allergenen,
  bedrijf,
  evenement,
  factuur,
  inkoop,
  ingredienten,
  klant,
  levering,
  offerte,
  picking,
  producten,
  recepten,
} from './fixtures';

const order = {
  id: 'ord-1',
  event: 'evt-1',
  offerte: 'off-1',
  status: 'bevestigd' as const,
  bevestigingsdatum: '2026-06-01',
};

describe('documentmodel', () => {
  it('dekt alle tien documenttypes uit §5, met materialen als eigen document', () => {
    expect(DOCUMENT_TYPES).toHaveLength(10);
    expect(DOCUMENT_TYPES).toContain('inkooplijst');
    expect(DOCUMENT_TYPES).toContain('materialenlijst');
  });

  it('maakt bestandsnamen zonder spaties of speciale tekens', () => {
    const document = maakOfferteDocument(offerte, evenement, klant, bedrijf);

    expect(document.bestandsnaam).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(document.bestandsnaam).toContain('Familie-Jansen');
  });
});

describe('offerte (§5)', () => {
  it('bouwt titel, ontvanger en regels op', () => {
    const document = maakOfferteDocument(offerte, evenement, klant, bedrijf);

    expect(document.type).toBe('offerte');
    expect(document.titel).toBe('Offerte 1');
    expect(document.ondertitel).toBe('Offerte voor Familie Jansen');
    expect(document.secties[0]?.kolommen).toEqual([
      'Omschrijving',
      'Aantal',
      'Prijs',
      'Btw',
      'Totaal',
    ]);
    expect(document.secties[0]?.rijen[0]?.cellen[0]).toBe('Zalmfilet met roomsaus');
  });

  it('splitst de btw per tarief uit in de totalen', () => {
    const document = maakOfferteDocument(offerte, evenement, klant, bedrijf);

    expect(document.totalen.map((regel) => regel.label)).toEqual([
      'Subtotaal',
      'Btw 9%',
      'Btw 21%',
      'Totaal',
    ]);
    expect(document.totalen.at(-1)?.waarde).toBe('€\u00a02.969,75');
  });

  it('neemt de geldigheidsdatum op in de voettekst', () => {
    const document = maakOfferteDocument(offerte, evenement, klant, bedrijf);

    expect(document.voettekst).toContain('20 juli 2026');
  });
});

describe('orderbevestiging (§5)', () => {
  it('toont standaard geen prijzen', () => {
    const document = maakOrderbevestigingDocument(order, offerte, evenement, klant, bedrijf);

    expect(document.secties[0]?.kolommen).toHaveLength(2);
    expect(document.totalen).toEqual([]);
  });

  it('toont prijzen wanneer dat gevraagd wordt', () => {
    const document = maakOrderbevestigingDocument(order, offerte, evenement, klant, bedrijf, {
      toonPrijzen: true,
    });

    expect(document.secties[0]?.kolommen).toHaveLength(3);
    expect(document.totalen.at(-1)?.waarde).toBe('€\u00a02.969,75');
  });
});

describe('productielijst (§5/§4.4)', () => {
  it('groepeert de geschaalde ingrediënten per keukenstation', () => {
    const productie = berekenEvenementProductie(evenement, producten, {
      recepten,
      ingredienten: ingredienten,
    });
    const document = maakProductielijstDocument(productie, evenement, bedrijf);

    expect(document.secties.map((sectie) => sectie.titel)).toEqual(['Warme keuken', 'Overig']);
    expect(document.secties[0]?.rijen[0]?.cellen).toEqual([
      'Zalmfilet met roomsaus',
      'Zalmfilet',
      '18.000 gram',
    ]);
  });

  it('houdt productiehoeveelheden exact, zonder inkoopafronding', () => {
    const productie = berekenEvenementProductie(evenement, producten, {
      recepten,
      ingredienten: ingredienten,
    });
    const document = maakProductielijstDocument(productie, evenement, bedrijf);

    expect(document.secties[0]?.rijen[1]?.cellen[2]).toBe('3.000 ml');
  });
});

describe('keukenlijst (§5)', () => {
  it('neemt bereidingswijze en kooktijd op', () => {
    const productie = berekenEvenementProductie(evenement, producten, {
      recepten,
      ingredienten: ingredienten,
    });
    const document = maakKeukenlijstDocument(productie, evenement, recepten, bedrijf);

    expect(document.blokken[0]?.titel).toBe('Zalmfilet met roomsaus');
    expect(document.blokken[0]?.regels).toContain('Zalm stomen, saus monteren met koude boter.');
    expect(document.blokken[0]?.regels).toContain('Kooktijd: 25 minuten');
  });
});

describe('inkooplijst (§5/§4.4)', () => {
  it('groepeert per leverancier en rondt af op de inkoopeenheid', () => {
    const document = maakInkooplijstDocument(inkoop, bedrijf);

    expect(document.secties[0]?.titel).toBe('Vishandel De Golf');
    expect(document.secties[0]?.rijen[0]?.cellen).toEqual([
      'Zalmfilet',
      '3 kg',
      '€\u00a025,00',
      '€\u00a075,00',
    ]);
  });

  it('laat materialen er bewust buiten: die hebben een eigen document (B14)', () => {
    const document = maakInkooplijstDocument(inkoop, bedrijf);

    expect(document.secties.map((sectie) => sectie.titel)).toEqual(['Vishandel De Golf']);
  });

  it('telt de totale inkoopkostprijs op', () => {
    const document = maakInkooplijstDocument(inkoop, bedrijf);

    expect(document.totalen[0]?.waarde).toBe('€\u00a075,00');
  });
});

describe('paklijst (§5)', () => {
  it('maakt een afvinkbare lijst met voedsel en materialen', () => {
    const document = maakPaklijstDocument(picking, evenement, klant, bedrijf);

    expect(document.secties[0]?.titel).toBe('Voedsel');
    expect(document.secties[1]?.titel).toBe('Materialenlijst');
    expect(document.secties[0]?.rijen[0]?.cellen[2]).toBe('☑');
    expect(document.secties[1]?.rijen[0]?.cellen[2]).toBe('☐');
    expect(document.secties[0]?.rijen[0]?.afvinkbaar).toBe(true);
  });
});

describe('leveringslijst (§5)', () => {
  it('neemt leverdatum, tijd en verantwoordelijke op', () => {
    const document = maakLeveringslijstDocument(levering, evenement, klant, bedrijf);

    expect(document.meta).toEqual([
      { label: 'Leverdatum', waarde: '20 juni 2026' },
      { label: 'Levertijd', waarde: '16:30' },
      { label: 'Verantwoordelijke', waarde: 'Piet' },
      { label: 'Status', waarde: 'gepland' },
    ]);
  });

  it('valt terug op het klantadres als er geen leveradres is', () => {
    const document = maakLeveringslijstDocument(levering, evenement, klant, bedrijf);

    expect(document.blokken[0]?.regels).toContain('Kerkweg 12');
  });

  it('voegt een inhoudsoverzicht toe wanneer meegegeven', () => {
    const document = maakLeveringslijstDocument(levering, evenement, klant, bedrijf, [
      { naam: 'Dinerbord', aantal: 100, eenheid: 'stuk' },
    ]);

    expect(document.secties[0]?.titel).toBe('Inhoud');
  });
});

describe('allergenenlijst (§5/§4.3)', () => {
  function maak(overschrijf: Partial<Evenement> = {}) {
    return maakAllergenenlijstDocument({
      evenement: { ...evenement, ...overschrijf },
      producten,
      recepten,
      ingredienten,
      allergenen,
      klant,
      bedrijf,
    });
  }

  it('zet de allergenen als rij en de gerechten als kolom', () => {
    const document = maak();

    expect(document.secties[0]?.titel).toBe('Allergenenmatrix');
    expect(document.secties[0]?.kolommen).toEqual([
      'Allergeen',
      'Zalmfilet met roomsaus',
      'Gepofte krielaardappel',
      'Huiswijn rood',
    ]);
  });

  it('geeft elk wettelijk allergeen een rij, ook als het nergens in zit', () => {
    const document = maak();

    expect(document.secties[0]?.rijen.map((rij) => rij.cellen[0])).toEqual([
      'Gluten (GLUTEN)',
      'Melk (MELK)',
      'Selderij (SELDERIJ)',
      'Vis (VIS)',
    ]);
  });

  it('leidt per gerecht live af welke allergenen erin zitten', () => {
    const document = maak();
    const rijen = document.secties[0]?.rijen ?? [];

    expect(rijen[0]?.cellen).toEqual(['Gluten (GLUTEN)', '', '', '']);
    expect(rijen[1]?.cellen).toEqual(['Melk (MELK)', 'X', '', '']);
    expect(rijen[2]?.cellen).toEqual(['Selderij (SELDERIJ)', '', 'X', '']);
    expect(rijen[3]?.cellen).toEqual(['Vis (VIS)', 'X', '', '']);
  });

  it('laat een gerecht zonder allergenen als lege kolom staan', () => {
    for (const rij of maak().secties[0]?.rijen ?? []) {
      expect(rij.cellen[3]).toBe('');
    }
  });

  it('benadrukt alleen de allergenen die daadwerkelijk voorkomen', () => {
    expect(maak().secties[0]?.rijen.map((rij) => rij.nadruk)).toEqual([false, true, true, true]);
  });

  it('draait op de gewone A4-staande pagina, zonder uitzondering op de standaard', () => {
    expect(maak().secties[0]?.matrix).toBe(true);
  });

  it('splitst een groot menu in meerdere matrices', () => {
    const veelGerechten = Array.from({ length: 9 }, () => ({ product: 'prod-zalm' }));

    const document = maak({ producten: veelGerechten });

    expect(document.secties).toHaveLength(3);
    expect(document.secties[0]?.titel).toBe('Allergenenmatrix — deel 1 van 3');
    expect(document.secties[2]?.titel).toBe('Allergenenmatrix — deel 3 van 3');
    expect(document.secties[0]?.rijen).toHaveLength(4);
  });

  it('geeft de allergeenkolom ruim de helft van de breedte', () => {
    const document = maak();
    const breedtes = document.secties[0]?.breedtes ?? [];

    expect(breedtes[0]).toBe(7);
    expect(breedtes.slice(1)).toEqual([3, 3, 3]);
  });

  it('geeft een toelichting mee over hoe de matrix te lezen is', () => {
    expect(maak().blokken[0]?.regels[0]).toContain('Alle veertien wettelijke allergenen');
  });

  it('waarschuwt wanneer van een gerecht geen allergenen bekend zijn (B15)', () => {
    // De wijn in de fixtures heeft geen recept en geen tags: het systeem mag daar niets over
    // beweren en moet dat zichtbaar melden.
    const document = maak();
    const waarschuwing = document.blokken.find(
      (blok) => blok.titel === 'Let op — allergeneninformatie ontbreekt',
    );

    expect(waarschuwing).toBeDefined();
    expect(waarschuwing?.regels[0]).toContain('mag er dus niets over beweren');
    expect(waarschuwing?.regels).toContain(
      'Huiswijn rood — allergenen onbekend, niet gecontroleerd',
    );
  });

  it('waarschuwt niet wanneer alle gerechten een recept of tags hebben', () => {
    const alleenZalm = maak({ producten: [{ product: 'prod-zalm' }] });

    expect(
      alleenZalm.blokken.find((blok) => blok.titel === 'Let op — allergeneninformatie ontbreekt'),
    ).toBeUndefined();
  });

  it('weigert een lijst zonder bekende gerechten', () => {
    expect(() => maak({ producten: [] })).toThrow(DocumentFout);
  });
});

describe('materialenlijst (B14)', () => {
  const behoefte = [
    {
      materiaal: 'mat-bord',
      naam: 'Dinerbord',
      eenheid: 'stuk' as const,
      automatisch: 250,
      handmatig: 10,
      totaal: 260,
      herkomst: ['Zalmfilet met roomsaus'],
    },
    {
      materiaal: 'mat-warmhoudplaat',
      naam: 'Warmhoudplaat',
      eenheid: 'stuk' as const,
      automatisch: 5,
      handmatig: 0,
      totaal: 5,
      herkomst: ['Zalmfilet met roomsaus', 'Groene asperges'],
    },
    {
      materiaal: 'mat-bestek',
      naam: 'Bestekset',
      eenheid: 'stuk' as const,
      automatisch: 0,
      handmatig: 250,
      totaal: 250,
      herkomst: [],
    },
  ];

  it('is een zelfstandig document, los van de inkooplijst', () => {
    const document = maakMaterialenlijstDocument({ evenement, materialen: behoefte, klant, bedrijf });

    expect(document.type).toBe('materialenlijst');
    expect(document.titel).toBe('Materialenlijst');
    expect(document.ondertitel).toBe('Materialenlijst Bruiloft Jansen');
  });

  it('toont per materiaal het aantal en waar het vandaan komt', () => {
    const document = maakMaterialenlijstDocument({ evenement, materialen: behoefte, klant, bedrijf });

    expect(document.secties[0]?.kolommen).toEqual(['Materiaal', 'Aantal', 'Herkomst']);
    expect(document.secties[0]?.rijen[0]?.cellen).toEqual([
      'Dinerbord',
      '260 stuk',
      'Zalmfilet met roomsaus · Handmatig toegevoegd',
    ]);
  });

  it('benadrukt wat handmatig is toegevoegd, zodat het opvalt', () => {
    const document = maakMaterialenlijstDocument({ evenement, materialen: behoefte, klant, bedrijf });

    expect(document.secties[0]?.rijen.map((rij) => rij.nadruk)).toEqual([true, false, true]);
  });

  it('vat samen hoeveel automatisch en hoeveel handmatig is', () => {
    const document = maakMaterialenlijstDocument({ evenement, materialen: behoefte, klant, bedrijf });

    expect(document.blokken[0]?.regels).toEqual([
      '3 materiaalsoorten',
      'Uit de gerechten: 2',
      'Handmatig toegevoegd: 2',
    ]);
  });

  it('levert een leeg maar geldig document zonder materialen', () => {
    const document = maakMaterialenlijstDocument({
      evenement,
      materialen: [],
      klant,
      bedrijf,
    });

    expect(document.secties).toEqual([]);
    expect(document.blokken[0]?.regels).toContain('Voor dit evenement zijn geen materialen nodig.');
  });
});

describe('documentlabels', () => {
  it('heeft voor elk documenttype een Nederlandse naam', () => {
    const labels: Record<string, string> = nl.documenten;

    for (const type of DOCUMENT_TYPES) {
      expect(labels[type], `label ontbreekt voor ${type}`).toBeDefined();
    }
  });
});

describe('factuur (§5)', () => {
  it('toont factuurnummer, data en een btw-uitsplitsing', () => {
    const document = maakFactuurDocument(factuur, klant, bedrijf);

    expect(document.titel).toBe('Factuur');
    expect(document.ondertitel).toBe('Factuur F2026-0001');
    expect(document.meta.map((regel) => regel.waarde)).toEqual([
      'F2026-0001',
      '25 juni 2026',
      '25 juli 2026',
    ]);
    expect(document.totalen.at(-1)?.waarde).toBe('€\u00a02.016,50');
  });

  it('neemt de betaalgegevens en het IBAN op', () => {
    const document = maakFactuurDocument(factuur, klant, bedrijf);
    const betaalblok = document.blokken.find((blok) => blok.titel === 'Betaalgegevens');

    expect(betaalblok?.regels).toContain('IBAN NL91ABNA0417164300');
    expect(betaalblok?.regels).toContain('Onder vermelding van F2026-0001');
  });

  it('gebruikt de vervaldatum in de bestandsnaam', () => {
    const document = maakFactuurDocument(factuur, klant, bedrijf);

    expect(document.bestandsnaam).toBe('Factuur_F2026-0001_2026-06-25');
  });
});

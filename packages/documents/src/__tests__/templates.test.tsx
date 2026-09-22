import { describe, expect, it } from 'vitest';
import type { DocumentModel } from '../model';
import { naarHtmlDocument, naarHtmlFragment } from '../templates/html';

const model: DocumentModel = {
  type: 'offerte',
  titel: 'Offerte 1',
  ondertitel: 'Offerte voor Familie Jansen',
  meta: [
    { label: 'Versie', waarde: '1' },
    { label: 'Datum', waarde: '20 juni 2026' },
  ],
  blokken: [
    { titel: 'Klantgegevens', regels: ['Familie Jansen', 'Kerkweg 12', '3511 AB Utrecht'] },
  ],
  secties: [
    {
      kolommen: ['Omschrijving', 'Aantal', 'Totaal'],
      rijen: [
        { cellen: ['Zalmfilet met roomsaus', '100', '€ 1.850,00'] },
        { cellen: ['Huiswijn rood', '100', '€ 450,00'], nadruk: true },
      ],
      breedtes: [4, 1, 2],
    },
  ],
  totalen: [
    { label: 'Subtotaal', waarde: '€ 2.675,00' },
    { label: 'Totaal', waarde: '€ 2.969,75', nadruk: true },
  ],
  voettekst: 'Deze offerte is geldig tot 20 juli 2026.',
  bestandsnaam: 'Offerte_Familie-Jansen_2026-07-20',
};

describe('documentsjabloon (§5)', () => {
  it('rendert titel, ondertitel en het documenttype', () => {
    const html = naarHtmlFragment(model);

    expect(html).toContain('Offerte 1');
    expect(html).toContain('Offerte voor Familie Jansen');
    expect(html).toContain('fb-document');
  });

  it('rendert de metaregels als label/waarde-paren', () => {
    const html = naarHtmlFragment(model);

    expect(html).toContain('<th scope="row">Versie</th>');
    expect(html).toContain('<td>1</td>');
    expect(html).toContain('<th scope="row">Datum</th>');
    expect(html).toContain('<td>20 juni 2026</td>');
  });

  it('rendert de adresblokken', () => {
    const html = naarHtmlFragment(model);

    expect(html).toContain('Klantgegevens');
    expect(html).toContain('Kerkweg 12');
    expect(html).toContain('3511 AB Utrecht');
  });

  it('rendert secties met kolomkoppen en rijen', () => {
    const html = naarHtmlFragment(model);

    expect(html).toContain('Zalmfilet met roomsaus');
    expect(html).toContain('Huiswijn rood');
    expect(html).toContain('<th scope="col">Omschrijving</th>');
    expect(html).toContain('<th scope="col">Aantal</th>');
  });

  it('zet de opgegeven kolombreedtes om naar procentuele breedtes', () => {
    const html = naarHtmlFragment(model);

    expect(html).toContain('<colgroup>');
    expect(html).toContain('width:57.14');
    expect(html).toContain('width:14.28');
    expect(html).toContain('width:28.57');
  });

  it('laat de kolombreedtes weg als ze niet zijn opgegeven', () => {
    const zonderBreedtes: DocumentModel = {
      ...model,
      secties: [{ kolommen: ['Omschrijving'], rijen: [{ cellen: ['Zalmfilet'] }] }],
    };

    expect(naarHtmlFragment(zonderBreedtes)).not.toContain('<colgroup>');
    expect(naarHtmlFragment(zonderBreedtes)).toContain('Zalmfilet');
  });

  it('benadrukt een regel wanneer daarom gevraagd wordt', () => {
    const html = naarHtmlFragment(model);

    expect(html).toContain('fb-rij--nadruk');
    expect(html).toContain('fb-totaal--nadruk');
  });

  it('markeert afvinkbare regels voor de paklijst', () => {
    const paklijst: DocumentModel = {
      ...model,
      type: 'paklijst',
      secties: [
        {
          kolommen: ['Omschrijving', 'Aantal', 'Afgevinkt'],
          rijen: [{ cellen: ['Dinerbord', '100 stuk', '☐'], afvinkbaar: true }],
        },
      ],
    };

    expect(naarHtmlFragment(paklijst)).toContain('fb-rij--afvinkbaar');
  });

  it('rendert de voettekst', () => {
    expect(naarHtmlFragment(model)).toContain('Deze offerte is geldig tot 20 juli 2026.');
  });

  it('rendert geen lege blokken of secties', () => {
    const leeg: DocumentModel = { ...model, meta: [], blokken: [], secties: [], totalen: [] };
    const html = naarHtmlFragment(leeg);

    expect(html).not.toContain('fb-blokken');
    expect(html).not.toContain('fb-tabel');
    expect(html).not.toContain('fb-totalen');
  });
});

describe('veiligheid van het sjabloon', () => {
  it('escapet tekst uit de data in plaats van hem als HTML te interpreteren', () => {
    const gevaarlijk: DocumentModel = {
      ...model,
      titel: '<script>alert(1)</script>',
      blokken: [{ titel: 'Klantgegevens', regels: ['<img src=x onerror=alert(1)>'] }],
    };
    const html = naarHtmlFragment(gevaarlijk);

    expect(html).not.toContain('<script>');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('&lt;script&gt;');
  });

  it('negeert een logo-URL met een gevaarlijk protocol', () => {
    const html = naarHtmlFragment(model, { logo: 'javascript:alert(1)' });

    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('fb-kop__merk');
  });

  it('accepteert een gewone logo-URL wel', () => {
    const html = naarHtmlFragment(model, { logo: '/api/media/file/logo.png' });

    expect(html).toContain('src="/api/media/file/logo.png"');
  });
});

describe('merkgegevens (§5)', () => {
  it('past de bedrijfskleuren toe als CSS-variabelen', () => {
    const html = naarHtmlFragment(model, {
      primaireKleur: '#123456',
      secundaireKleur: '#abcdef',
    });

    expect(html).toContain('--fb-primair:#123456');
    expect(html).toContain('--fb-secundair:#abcdef');
  });

  it('rendert zonder merkgegevens', () => {
    expect(naarHtmlFragment(model)).not.toContain('--fb-primair');
  });
});

describe('de documentstandaard', () => {
  it('gebruikt één paginamaat: A4 staand', () => {
    const html = naarHtmlDocument(model);

    expect(html).toContain('size: A4 portrait');
    expect(html).not.toContain('landscape');
  });

  it('houdt dezelfde marge aan op scherm en op papier', () => {
    const html = naarHtmlDocument(model);

    // Scherm: padding op het document. Papier: marge via @page, padding op nul.
    expect(html).toContain('--fb-pagina-marge: 14mm');
    expect(html).toContain('padding: var(--fb-pagina-marge)');
    expect(html).toContain('margin: 14mm');
  });

  it('leidt de paginabreedte uit één variabele af', () => {
    const html = naarHtmlDocument(model);

    expect(html).toContain('--fb-pagina-breedte: 210mm');
    expect(html).toContain('width: var(--fb-pagina-breedte)');
  });

  it('zet de schermversiering uit op papier', () => {
    const html = naarHtmlDocument(model);

    expect(html).toContain('@media print');
    expect(html).toContain('box-shadow: none');
  });

  it('markeert een matrixsectie zodat de cellen gecentreerd worden', () => {
    const matrix: DocumentModel = {
      ...model,
      secties: [
        {
          kolommen: ['Allergeen', 'Gerecht'],
          rijen: [{ cellen: ['Melk (MELK)', 'X'] }],
          matrix: true,
        },
      ],
    };

    expect(naarHtmlFragment(matrix)).toContain('fb-tabel--matrix');
    expect(naarHtmlFragment(model)).not.toContain('fb-tabel--matrix');
  });
});

describe('volledig HTML-document', () => {
  it('levert een zelfstandig, Nederlands document met de opmaak ingebed', () => {
    const html = naarHtmlDocument(model);

    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<html lang="nl">');
    expect(html).toContain('<title>Offerte 1</title>');
    expect(html).toContain('@page');
    expect(html).toContain('@media print');
    expect(html).toContain('Offerte voor Familie Jansen');
  });

  it('escapet de titel in het title-element', () => {
    const html = naarHtmlDocument({ ...model, titel: '<b>Offerte</b>' });

    expect(html).toContain('<title>&lt;b&gt;Offerte&lt;/b&gt;</title>');
  });
});

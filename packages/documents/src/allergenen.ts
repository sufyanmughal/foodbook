import type {
  Allergeen,
  Bedrijfsinstellingen,
  Evenement,
  ID,
  Ingredient,
  Klant,
  Product,
  Recept,
} from '@foodbook/shared-types';
import { allergenenVanProduct, productenZonderAllergenenInfo } from '@foodbook/calculation-engine';
import { formatteerDatum, t } from '@foodbook/i18n';
import {
  DocumentFout,
  bedrijfsBlok,
  klantBlok,
  maakBestandsnaam,
  type DocumentModel,
  type DocumentRij,
  type DocumentSectie,
} from './model';

export interface AllergenenlijstInput {
  evenement: Evenement;
  producten: Record<ID, Product>;
  recepten: Record<ID, Recept>;
  ingredienten: Record<ID, Ingredient>;
  /** De wettelijke referentielijst; bepaalt de rijen van de matrix. */
  allergenen: Allergeen[];
  klant: Klant;
  bedrijf: Bedrijfsinstellingen;
}

/**
 * Aantal gerechten per matrix.
 *
 * De standaard is A4 staand met 182 mm tekstbreedte. De allergeenkolom heeft ruim de helft nodig
 * voor namen als "Zwaveldioxide en sulfieten (SULFIET)"; de rest blijft over voor de gerechten.
 * Vier gerechten per matrix geeft kolommen van ruim 30 mm — genoeg om een gerechtnaam in enkele
 * regels leesbaar te tonen. Meer gerechten per matrix maakt de kolomkoppen onleesbaar, en dat is
 * precies wat een allergenenlijst niet mag zijn.
 */
const MAX_GERECHTEN_PER_MATRIX = 4;

interface Gerecht {
  naam: string;
  allergenen: Set<string>;
}

/**
 * §5 — allergenenlijst: de allergenenmatrix.
 *
 * Dit is het gevoeligste document van het systeem: een gemiste allergenen-tag is een
 * veiligheids- en juridisch risico. Twee keuzes volgen daaruit:
 *
 * 1. De allergenen staan als *rij* en de gerechten als kolom. Andersom — veertien lange
 *    Nederlandse allergeennamen als kolomkop — is niet leesbaar, en een onleesbare
 *    allergenenlijst is erger dan geen.
 * 2. Alle wettelijke allergenen krijgen een rij, ook de allergenen die in geen enkel gerecht
 *    voorkomen, zodat zichtbaar is dat er op alle veertien is gecontroleerd.
 *
 * De lijst wordt live afgeleid uit de ingrediëntlaag (§4.3) in plaats van handmatig ingevuld.
 * Draait op de gewone A4-staande pagina, net als elk ander document; bij een groot menu komen er
 * meerdere matrices onder elkaar.
 */
export function maakAllergenenlijstDocument(input: AllergenenlijstInput): DocumentModel {
  const { evenement, producten, recepten, ingredienten, allergenen, klant, bedrijf } = input;

  const gesorteerdeAllergenen = [...allergenen].sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));

  const gerechten: Gerecht[] = evenement.producten
    .map((eventRegel) => producten[eventRegel.product])
    .filter((product): product is Product => product !== undefined)
    .map((product) => ({
      naam: product.naam,
      allergenen: new Set(allergenenVanProduct(product, recepten, ingredienten)),
    }));

  if (gerechten.length === 0) {
    throw new DocumentFout(
      'Kan geen allergenenlijst maken: het evenement bevat geen gerechten met een bekend product.',
    );
  }

  const voorkomend = new Set(gerechten.flatMap((gerecht) => [...gerecht.allergenen]));

  // B15 — producten waarvan niets bekend is. Die krijgen een eigen regel én een waarschuwingsblok,
  // zodat "geen X" niet gelezen wordt als "bevat niets".
  const onbekend = productenZonderAllergenenInfo(
    evenement.producten
      .map((regel) => producten[regel.product])
      .filter((product): product is Product => product !== undefined),
  );

  const groepen = chunk(gerechten, MAX_GERECHTEN_PER_MATRIX);
  const secties: DocumentSectie[] = groepen.map((groep, index) => ({
    titel:
      groepen.length > 1
        ? t('documentKoppen.allergenenMatrixDeel', { deel: index + 1, totaal: groepen.length })
        : t('documentKoppen.allergenenMatrix'),
    kolommen: [t('documentKoppen.allergeenKolom'), ...groep.map((gerecht) => gerecht.naam)],
    rijen: gesorteerdeAllergenen.map(
      (allergeen): DocumentRij => ({
        cellen: [
          `${allergeen.naam} (${allergeen.wettelijkeCode})`,
          ...groep.map((gerecht) => (gerecht.allergenen.has(allergeen.id) ? 'X' : '')),
        ],
        // Een allergeen dat daadwerkelijk voorkomt oplichten: dat is de regel die telt.
        nadruk: voorkomend.has(allergeen.id),
      }),
    ),
    // Ruim de helft voor de allergeennaam, de rest gelijk verdeeld over de gerechten.
    breedtes: [7, ...groep.map(() => 3)],
    matrix: true,
  }));

  const opmerkingen = [
    t('documentKoppen.allergenenToelichting'),
    ...(voorkomend.size === 0 ? [t('documentKoppen.geenAllergenen')] : []),
  ];

  const blokken = [
    { titel: t('documentKoppen.toelichting'), regels: opmerkingen },
    // De waarschuwing staat bewust bovenaan de blokken, niet weggestopt in een voetnoot.
    ...(onbekend.length > 0
      ? [
          {
            titel: t('documentKoppen.allergenenOnbekend'),
            regels: [
              t('documentKoppen.allergenenOnbekendUitleg'),
              ...onbekend.map((product) => t('documentKoppen.allergenenOnbekendRegel', { naam: product.naam })),
            ],
          },
        ]
      : []),
    klantBlok(klant),
    bedrijfsBlok(bedrijf),
  ];

  return {
    type: 'allergenenlijst',
    titel: t('documenten.allergenenlijst'),
    ondertitel: t('documentKoppen.allergenenlijstVoor', { evenement: evenement.titel }),
    meta: [
      { label: t('velden.datum'), waarde: formatteerDatum(evenement.datum) },
      { label: t('velden.klant'), waarde: klant.naam },
      { label: t('velden.aantalGasten'), waarde: String(evenement.aantalGasten) },
    ],
    blokken,
    secties,
    totalen: [],
    voettekst: bedrijf.standaardVoettekst,
    bestandsnaam: maakBestandsnaam([
      t('documenten.allergenenlijst'),
      evenement.titel,
      evenement.datum,
    ]),
  };
}

function chunk<T>(waarden: T[], grootte: number): T[][] {
  const groepen: T[][] = [];
  for (let index = 0; index < waarden.length; index += grootte) {
    groepen.push(waarden.slice(index, index + grootte));
  }
  return groepen;
}

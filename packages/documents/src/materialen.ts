import type {
  Bedrijfsinstellingen,
  Evenement,
  Klant,
  MateriaalBehoefte,
} from '@foodbook/shared-types';
import { formatteerDatum, formatteerHoeveelheid, t } from '@foodbook/i18n';
import {
  bedrijfsBlok,
  klantBlok,
  maakBestandsnaam,
  type DocumentModel,
  type DocumentRij,
} from './model';

export interface MaterialenlijstInput {
  evenement: Evenement;
  /** De materiaalbehoefte zoals de rekenmotor die heeft bepaald (B14). */
  materialen: MateriaalBehoefte[];
  klant: Klant;
  bedrijf: Bedrijfsinstellingen;
}

/**
 * §5/B14 — de materialenlijst.
 *
 * Een **zelfstandig document**, los van de voedselinkoop: voedsel loopt via recepten naar
 * productie en inkoop, materialen lopen via deze lijst. Dat is wat de klant vroeg — het zijn twee
 * verschillende processen en dus twee verschillende papieren.
 *
 * Per materiaal staat er waar het vandaan komt. Dat is niet alleen aardig voor de lezer: het
 * maakt zichtbaar welk deel automatisch uit het menu is gekomen en welk deel iemand met de hand
 * heeft toegevoegd. Zonder die splitsing is een verkeerd aantal niet te herleiden.
 */
export function maakMaterialenlijstDocument(input: MaterialenlijstInput): DocumentModel {
  const { evenement, materialen, klant, bedrijf } = input;

  const rijen: DocumentRij[] = materialen.map((regel) => ({
    cellen: [
      regel.naam,
      formatteerHoeveelheid(regel.totaal, regel.eenheid),
      herkomstTekst(regel),
    ],
    nadruk: regel.handmatig > 0,
  }));

  const aantalAutomatisch = materialen.filter((regel) => regel.automatisch > 0).length;
  const aantalHandmatig = materialen.filter((regel) => regel.handmatig > 0).length;

  const opmerkingen = [
    t('documentKoppen.aantalMaterialen', { aantal: materialen.length }),
    ...(aantalAutomatisch > 0
      ? [`${t('documentKoppen.uitGerechten')}: ${aantalAutomatisch}`]
      : []),
    ...(aantalHandmatig > 0
      ? [`${t('documentKoppen.handmatigToegevoegd')}: ${aantalHandmatig}`]
      : []),
    ...(materialen.length === 0 ? [t('documentKoppen.geenMaterialen')] : []),
  ];

  return {
    type: 'materialenlijst',
    titel: t('documenten.materialenlijst'),
    ondertitel: t('documentKoppen.materialenlijstVoor', { evenement: evenement.titel }),
    meta: [
      { label: t('velden.datum'), waarde: formatteerDatum(evenement.datum) },
      { label: t('velden.aantalGasten'), waarde: String(evenement.aantalGasten) },
      ...(evenement.locatie !== undefined
        ? [{ label: t('velden.locatie'), waarde: evenement.locatie }]
        : []),
    ],
    blokken: [
      { titel: t('documentKoppen.toelichting'), regels: opmerkingen },
      klantBlok(klant),
      ...(evenement.locatie !== undefined
        ? [{ titel: t('documentKoppen.leveradres'), regels: [evenement.locatie] }]
        : []),
      bedrijfsBlok(bedrijf),
    ],
    secties:
      rijen.length > 0
        ? [
            {
              kolommen: [
                t('documentKoppen.materiaal'),
                t('documentKoppen.regelAantal'),
                t('documentKoppen.herkomst'),
              ],
              rijen,
              breedtes: [5, 3, 6],
            },
          ]
        : [],
    totalen: [],
    voettekst: bedrijf.standaardVoettekst,
    bestandsnaam: maakBestandsnaam([
      t('documenten.materialenlijst'),
      evenement.titel,
      evenement.datum,
    ]),
  };
}

/** Onderbouwing per regel: uit welke gerechten het komt, en of er iets handmatig bij is gekomen. */
function herkomstTekst(regel: MateriaalBehoefte): string {
  const delen: string[] = [];

  if (regel.herkomst.length > 0) delen.push(regel.herkomst.join(', '));
  if (regel.handmatig > 0) delen.push(t('documentKoppen.handmatigToegevoegd'));

  return delen.join(' · ');
}

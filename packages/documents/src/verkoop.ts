import type {
  Bedrijfsinstellingen,
  BtwUitsplitsing,
  Evenement,
  Factuur,
  Klant,
  Offerte,
  Order,
} from '@foodbook/shared-types';
import { formatteerBedrag, formatteerDatum, t } from '@foodbook/i18n';
import {
  bedrijfsBlok,
  klantBlok,
  maakBestandsnaam,
  type DocumentMetaRegel,
  type DocumentModel,
  type DocumentRij,
} from './model';

function btwTotalen(
  uitsplitsing: BtwUitsplitsing[],
  subtotaal: number,
  totaal: number,
): DocumentMetaRegel[] {
  return [
    { label: t('velden.subtotaal'), waarde: formatteerBedrag(subtotaal) },
    ...uitsplitsing.map((regel) => ({
      label: `${t('velden.btw')} ${regel.percentage}%`,
      waarde: formatteerBedrag(regel.btwBedrag),
    })),
    { label: t('velden.totaal'), waarde: formatteerBedrag(totaal), nadruk: true },
  ];
}

/** §5 — de offerte: regels, prijzen, btw, voorwaarden en geldigheidsdatum. */
export function maakOfferteDocument(
  offerte: Offerte,
  evenement: Evenement,
  klant: Klant,
  bedrijf: Bedrijfsinstellingen,
): DocumentModel {
  const rijen: DocumentRij[] = offerte.regels.map((regel) => ({
    cellen: [
      regel.productNaam,
      String(regel.aantalGasten),
      formatteerBedrag(regel.prijsPerPersoon),
      `${regel.btwPercentage}%`,
      formatteerBedrag(regel.regelTotaalExcl),
    ],
  }));

  return {
    type: 'offerte',
    titel: `${t('documenten.offerte')} ${offerte.versie}`,
    ondertitel: t('documentKoppen.offerteVoor', { klant: klant.naam }),
    meta: [
      { label: t('velden.versie'), waarde: String(offerte.versie) },
      { label: t('velden.datum'), waarde: formatteerDatum(evenement.datum) },
      { label: t('velden.geldigTot'), waarde: formatteerDatum(offerte.geldigTot) },
      { label: t('velden.aantalGasten'), waarde: String(evenement.aantalGasten) },
    ],
    blokken: [klantBlok(klant), bedrijfsBlok(bedrijf)],
    secties: [
      {
        kolommen: [
          t('documentKoppen.regelOmschrijving'),
          t('documentKoppen.regelAantal'),
          t('documentKoppen.regelPrijs'),
          t('velden.btw'),
          t('documentKoppen.regelTotaal'),
        ],
        rijen,
        breedtes: [4, 1, 2, 1, 2],
      },
    ],
    totalen: btwTotalen(offerte.btwUitsplitsing, offerte.subtotaal, offerte.totaal),
    voettekst: `${t('documentKoppen.offerteGeldigTot', { datum: formatteerDatum(offerte.geldigTot) })} ${bedrijf.standaardVoettekst}`,
    bestandsnaam: maakBestandsnaam([t('documenten.offerte'), klant.naam, offerte.geldigTot]),
  };
}

/** §5 — orderbevestiging. Prijzen zijn optioneel: standaard staat er geen prijs op. */
export function maakOrderbevestigingDocument(
  order: Order,
  offerte: Offerte,
  evenement: Evenement,
  klant: Klant,
  bedrijf: Bedrijfsinstellingen,
  opties: { toonPrijzen?: boolean } = {},
): DocumentModel {
  const toonPrijzen = opties.toonPrijzen ?? false;

  const rijen: DocumentRij[] = offerte.regels.map((regel) => ({
    cellen: toonPrijzen
      ? [
          regel.productNaam,
          String(regel.aantalGasten),
          formatteerBedrag(regel.regelTotaalExcl),
        ]
      : [regel.productNaam, String(regel.aantalGasten)],
  }));

  return {
    type: 'orderbevestiging',
    titel: t('documenten.orderbevestiging'),
    ondertitel: t('documentKoppen.orderbevestigingVoor', { klant: klant.naam }),
    meta: [
      { label: t('velden.titel'), waarde: evenement.titel },
      { label: t('velden.datum'), waarde: formatteerDatum(evenement.datum) },
      { label: t('velden.aantalGasten'), waarde: String(evenement.aantalGasten) },
      { label: t('velden.status'), waarde: order.status },
    ],
    blokken: [
      klantBlok(klant),
      ...(evenement.locatie !== undefined
        ? [{ titel: t('documentKoppen.leveradres'), regels: [evenement.locatie] }]
        : []),
      bedrijfsBlok(bedrijf),
    ],
    secties: [
      {
        kolommen: toonPrijzen
          ? [
              t('documentKoppen.regelOmschrijving'),
              t('documentKoppen.regelAantal'),
              t('documentKoppen.regelTotaal'),
            ]
          : [t('documentKoppen.regelOmschrijving'), t('documentKoppen.regelAantal')],
        rijen,
        breedtes: toonPrijzen ? [5, 2, 2] : [5, 2],
      },
    ],
    totalen: toonPrijzen
      ? btwTotalen(offerte.btwUitsplitsing, offerte.subtotaal, offerte.totaal)
      : [],
    voettekst: bedrijf.standaardVoettekst,
    bestandsnaam: maakBestandsnaam([t('documenten.orderbevestiging'), klant.naam, order.bevestigingsdatum]),
  };
}

/** §5 — de factuur: sequentieel nummer, btw per tarief, betaalvoorwaarden. */
export function maakFactuurDocument(
  factuur: Factuur,
  klant: Klant,
  bedrijf: Bedrijfsinstellingen,
): DocumentModel {
  const rijen: DocumentRij[] = factuur.regels.map((regel) => ({
    cellen: [
      regel.omschrijving,
      String(regel.aantal),
      formatteerBedrag(regel.eenheidsprijs),
      `${regel.btwPercentage}%`,
      formatteerBedrag(regel.regelTotaalExcl),
    ],
  }));

  return {
    type: 'factuur',
    titel: t('documenten.factuur'),
    ondertitel: t('documentKoppen.factuurVoor', { nummer: factuur.factuurnummer }),
    meta: [
      { label: t('velden.factuurnummer'), waarde: factuur.factuurnummer },
      { label: t('velden.factuurdatum'), waarde: formatteerDatum(factuur.factuurdatum) },
      { label: t('velden.vervaldatum'), waarde: formatteerDatum(factuur.vervaldatum) },
    ],
    blokken: [
      klantBlok(klant, t('documentKoppen.klantgegevens')),
      {
        titel: t('documentKoppen.betaalgegevens'),
        regels: [
          `IBAN ${bedrijf.iban}`,
          bedrijf.naam,
          t('documentKoppen.factuurVervaldatum', { datum: formatteerDatum(factuur.vervaldatum) }),
          `Onder vermelding van ${factuur.factuurnummer}`,
        ],
      },
      bedrijfsBlok(bedrijf),
    ],
    secties: [
      {
        kolommen: [
          t('documentKoppen.regelOmschrijving'),
          t('documentKoppen.regelAantal'),
          t('documentKoppen.regelPrijs'),
          t('velden.btw'),
          t('documentKoppen.regelTotaal'),
        ],
        rijen,
        breedtes: [5, 1, 2, 1, 2],
      },
    ],
    totalen: btwTotalen(factuur.btwUitsplitsing, factuur.subtotaal, factuur.totaal),
    voettekst: bedrijf.standaardVoettekst,
    bestandsnaam: maakBestandsnaam([t('documenten.factuur'), factuur.factuurnummer, factuur.factuurdatum]),
  };
}

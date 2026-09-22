import type {
  Bedrijfsinstellingen,
  Eenheid,
  Evenement,
  Inkoop,
  Klant,
  Levering,
  Picking,
  Recept,
} from '@foodbook/shared-types';
import { formatteerBedrag, formatteerDatum, formatteerHoeveelheid, t } from '@foodbook/i18n';
import type { EvenementProductie } from '@foodbook/calculation-engine';
import {
  adresRegels,
  bedrijfsBlok,
  klantBlok,
  maakBestandsnaam,
  type DocumentBlok,
  type DocumentModel,
  type DocumentRij,
} from './model';

export interface MateriaalRegel {
  naam: string;
  aantal: number;
  eenheid: Eenheid;
}

/**
 * §5 — productielijst: de geschaalde ingrediënten per gerecht, gegroepeerd per keukenstation.
 * Hoeveelheden zijn exact (§4.4): dit is de keuken, niet de inkoop.
 */
export function maakProductielijstDocument(
  productie: EvenementProductie,
  evenement: Evenement,
  bedrijf: Bedrijfsinstellingen,
): DocumentModel {
  const perStation = new Map<string, DocumentRij[]>();

  for (const regel of productie.regels) {
    const station = regel.keukenstation ?? t('algemeen.overig');
    const rijen = perStation.get(station) ?? [];

    if (regel.ingredienten.length === 0) {
      rijen.push({
        cellen: [
          regel.productNaam,
          t('documentKoppen.geenRecept'),
          formatteerHoeveelheid(regel.productHoeveelheid, regel.eenheid),
        ],
      });
    } else {
      for (const ingredient of regel.ingredienten) {
        rijen.push({
          cellen: [
            regel.productNaam,
            ingredient.naam,
            formatteerHoeveelheid(ingredient.hoeveelheid, ingredient.basisEenheid),
          ],
        });
      }
    }

    perStation.set(station, rijen);
  }

  return {
    type: 'productielijst',
    titel: t('documenten.productielijst'),
    ondertitel: t('documentKoppen.productielijstVoor', { evenement: evenement.titel }),
    meta: [
      { label: t('velden.datum'), waarde: formatteerDatum(evenement.datum) },
      { label: t('velden.aantalGasten'), waarde: String(evenement.aantalGasten) },
    ],
    blokken: [bedrijfsBlok(bedrijf)],
    secties: [...perStation.entries()].map(([station, rijen]) => ({
      titel: station,
      kolommen: [
        t('documentKoppen.gerechtKolom'),
        t('documentKoppen.ingredient'),
        t('documentKoppen.benodigd'),
      ],
      rijen,
      breedtes: [4, 4, 2],
    })),
    totalen: [],
    voettekst: bedrijf.standaardVoettekst,
    bestandsnaam: maakBestandsnaam([
      t('documenten.productielijst'),
      evenement.titel,
      evenement.datum,
    ]),
  };
}

/**
 * §5 — keukenlijst: bereidingswijze en timing per gerecht, met de benodigde ingrediënten.
 * Instructies staan als blokken, de ingrediënten als tabellen per gerecht.
 */
export function maakKeukenlijstDocument(
  productie: EvenementProductie,
  evenement: Evenement,
  recepten: Record<string, Recept>,
  bedrijf: Bedrijfsinstellingen,
): DocumentModel {
  const blokken: DocumentBlok[] = [];
  const secties: DocumentModel['secties'] = [];

  for (const regel of productie.regels) {
    const recept = regel.recept === undefined ? undefined : recepten[regel.recept];
    const instructies: string[] = [
      t('documentKoppen.aantalGasten', { aantal: regel.aantalGasten }),
    ];

    if (recept?.bereidingswijze !== undefined && recept.bereidingswijze.length > 0) {
      instructies.push(recept.bereidingswijze);
    }
    if (recept?.kooktijdMinuten !== undefined) {
      instructies.push(t('documentKoppen.kooktijd', { minuten: recept.kooktijdMinuten }));
    }

    blokken.push({ titel: regel.productNaam, regels: instructies });

    if (regel.ingredienten.length > 0) {
      secties.push({
        titel: regel.productNaam,
        kolommen: [t('documentKoppen.ingredient'), t('documentKoppen.benodigd')],
        rijen: regel.ingredienten.map((ingredient) => ({
          cellen: [
            ingredient.naam,
            formatteerHoeveelheid(ingredient.hoeveelheid, ingredient.basisEenheid),
          ],
        })),
        breedtes: [4, 2],
      });
    }
  }

  return {
    type: 'keukenlijst',
    titel: t('documenten.keukenlijst'),
    ondertitel: t('documentKoppen.keukenlijstVoor', { evenement: evenement.titel }),
    meta: [
      { label: t('velden.datum'), waarde: formatteerDatum(evenement.datum) },
      { label: t('velden.aantalGasten'), waarde: String(evenement.aantalGasten) },
    ],
    blokken,
    secties,
    totalen: [],
    voettekst: bedrijf.standaardVoettekst,
    bestandsnaam: maakBestandsnaam([t('documenten.keukenlijst'), evenement.titel, evenement.datum]),
  };
}

/**
 * §5 — inkooplijst, gegroepeerd per leverancier.
 * Hoeveelheden zijn naar boven afgerond op de inkoopeenheid (§4.4).
 *
 * Materialen staan hier bewust **niet** in (B14): die hebben een eigen document, want het zijn
 * twee verschillende processen. Voedsel koop je in, materiaal pak je in.
 */
export function maakInkooplijstDocument(
  inkoop: Inkoop,
  bedrijf: Bedrijfsinstellingen,
): DocumentModel {
  const perLeverancier = new Map<string, DocumentRij[]>();
  let totaalKostprijs = 0;

  for (const regel of inkoop.regels) {
    const leverancier = regel.leverancierNaam ?? t('algemeen.overig');
    const rijen = perLeverancier.get(leverancier) ?? [];
    totaalKostprijs += regel.kostprijs;
    rijen.push({
      cellen: [
        regel.naam,
        formatteerHoeveelheid(regel.hoeveelheid, regel.inkoopEenheid),
        formatteerBedrag(regel.eenheidsprijs),
        formatteerBedrag(regel.kostprijs),
      ],
    });
    perLeverancier.set(leverancier, rijen);
  }

  const secties: DocumentModel['secties'] = [...perLeverancier.entries()].map(
    ([leverancier, rijen]) => ({
      titel: leverancier,
      kolommen: [
        t('documentKoppen.ingredient'),
        t('documentKoppen.inTeKopen'),
        t('documentKoppen.regelPrijs'),
        t('documentKoppen.regelTotaal'),
      ],
      rijen,
      breedtes: [4, 2, 2, 2],
    }),
  );

  return {
    type: 'inkooplijst',
    titel: t('documenten.inkooplijst'),
    ondertitel: t('documentKoppen.inkooplijstPeriode', {
      van: formatteerDatum(inkoop.periodeVan),
      tot: formatteerDatum(inkoop.periodeTot),
    }),
    meta: [
      { label: t('velden.datum'), waarde: formatteerDatum(inkoop.periodeTot) },
    ],
    blokken: [bedrijfsBlok(bedrijf)],
    secties,
    totalen: [
      { label: t('velden.kostprijs'), waarde: formatteerBedrag(totaalKostprijs), nadruk: true },
    ],
    voettekst: bedrijf.standaardVoettekst,
    bestandsnaam: maakBestandsnaam([t('documenten.inkooplijst'), inkoop.periodeTot]),
  };
}

/** §5 — paklijst: afvinkbare opmaak, voedsel en materialen in één lijst. */
export function maakPaklijstDocument(
  picking: Picking,
  evenement: Evenement,
  klant: Klant,
  bedrijf: Bedrijfsinstellingen,
): DocumentModel {
  const voedsel: DocumentRij[] = [];
  const materiaal: DocumentRij[] = [];

  for (const regel of picking.regels) {
    const rij: DocumentRij = {
      cellen: [
        regel.omschrijving,
        formatteerHoeveelheid(regel.hoeveelheid, regel.eenheid),
        regel.afgevinkt ? '☑' : '☐',
      ],
      afvinkbaar: true,
    };
    if (regel.soort === 'voedsel') {
      voedsel.push(rij);
    } else {
      materiaal.push(rij);
    }
  }

  const kolommen = [
    t('documentKoppen.regelOmschrijving'),
    t('documentKoppen.regelAantal'),
    t('documentKoppen.regelAfvinken'),
  ];

  return {
    type: 'paklijst',
    titel: t('documenten.paklijst'),
    ondertitel: t('documentKoppen.paklijstVoor', { evenement: evenement.titel }),
    meta: [
      { label: t('velden.datum'), waarde: formatteerDatum(evenement.datum) },
      { label: t('velden.klant'), waarde: klant.naam },
    ],
    blokken: [
      ...(evenement.locatie !== undefined
        ? [{ titel: t('documentKoppen.leveradres'), regels: [evenement.locatie] }]
        : []),
      bedrijfsBlok(bedrijf),
    ],
    secties: [
      { titel: t('documentKoppen.voedsel'), kolommen, rijen: voedsel, breedtes: [5, 2, 1] },
      { titel: t('documenten.materialenlijst'), kolommen, rijen: materiaal, breedtes: [5, 2, 1] },
    ],
    totalen: [],
    voettekst: bedrijf.standaardVoettekst,
    bestandsnaam: maakBestandsnaam([t('documenten.paklijst'), evenement.titel, evenement.datum]),
  };
}

/** §5 — leveringslijst: adres, tijd, verantwoordelijke en een inhoudsoverzicht. */
export function maakLeveringslijstDocument(
  levering: Levering,
  evenement: Evenement,
  klant: Klant,
  bedrijf: Bedrijfsinstellingen,
  inhoud: MateriaalRegel[] = [],
): DocumentModel {
  const adres = levering.adres ?? klant.adres;
  const adresBlok: DocumentBlok = {
    titel: t('documentKoppen.leveradres'),
    regels: adres !== undefined ? adresRegels(adres) : evenement.locatie !== undefined ? [evenement.locatie] : [],
  };

  return {
    type: 'leveringslijst',
    titel: t('documenten.leveringslijst'),
    ondertitel: t('documentKoppen.leveringslijstVoor', { evenement: evenement.titel }),
    meta: [
      {
        label: t('velden.leverdatum'),
        waarde: formatteerDatum(levering.leverdatum),
      },
      { label: t('velden.levertijd'), waarde: levering.levertijd },
      {
        label: t('velden.verantwoordelijke'),
        waarde: levering.verantwoordelijke ?? t('algemeen.onbekend'),
      },
      { label: t('velden.status'), waarde: levering.status },
    ],
    blokken: [adresBlok, klantBlok(klant), bedrijfsBlok(bedrijf)],
    secties:
      inhoud.length > 0
        ? [
            {
              titel: t('documentKoppen.inhoud'),
              kolommen: [t('documentKoppen.regelOmschrijving'), t('documentKoppen.regelAantal')],
              rijen: inhoud.map((regel) => ({
                cellen: [regel.naam, formatteerHoeveelheid(regel.aantal, regel.eenheid)],
              })),
              breedtes: [5, 2],
            },
          ]
        : [],
    totalen: [],
    voettekst: bedrijf.standaardVoettekst,
    bestandsnaam: maakBestandsnaam([
      t('documenten.leveringslijst'),
      evenement.titel,
      levering.leverdatum,
    ]),
  };
}

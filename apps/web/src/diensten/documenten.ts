import {
  DocumentFout,
  maakAllergenenlijstDocument,
  maakFactuurDocument,
  maakInkooplijstDocument,
  maakKeukenlijstDocument,
  maakMaterialenlijstDocument,
  maakOfferteDocument,
  maakPaklijstDocument,
  maakProductielijstDocument,
  type DocumentModel,
} from '@foodbook/documents';
import type { Bedrijfsinstellingen, Factuur, ID, Offerte } from '@foodbook/shared-types';
import type { Payload } from 'payload';

import { berekenEvenement } from './keten';
import { naarPayloadId } from './ids';
import type { BedrijfsinstellingenRuw } from './dataset';

/**
 * Documenten die je vanuit een evenement kunt maken. De factuur zit er niet bij: die hoort bij
 * een order, niet rechtstreeks bij een evenement.
 */
export const EVENEMENT_DOCUMENTEN = [
  'offerte',
  'productielijst',
  'keukenlijst',
  'inkooplijst',
  'materialenlijst',
  'paklijst',
  'allergenenlijst',
] as const;

export type EvenementDocumentType = (typeof EVENEMENT_DOCUMENTEN)[number];

/**
 * Zet de bedrijfsinstellingen uit Payload om naar de vorm die de documentsjablonen verwachten.
 *
 * `logo` is in de database een relatie (id of een uitgeklapt object) en in het sjabloon een URL;
 * die twee vallen hier bewust niet samen.
 */
export function naarBedrijfsinstellingen(ruw: BedrijfsinstellingenRuw): Bedrijfsinstellingen {
  const logoId =
    ruw.logo === null || ruw.logo === undefined
      ? undefined
      : typeof ruw.logo === 'object'
        ? undefined
        : String(ruw.logo);

  return {
    naam: ruw.naam,
    ...(logoId !== undefined ? { logo: logoId } : {}),
    kvkNummer: ruw.kvkNummer,
    btwNummer: ruw.btwNummer,
    iban: ruw.iban,
    email: ruw.email,
    ...(ruw.telefoon ? { telefoon: ruw.telefoon } : {}),
    primaireKleur: ruw.primaireKleur,
    secundaireKleur: ruw.secundaireKleur,
    standaardVoettekst: ruw.standaardVoettekst,
    betalingstermijnDagen: ruw.betalingstermijnDagen,
    offerteGeldigheidDagen: ruw.offerteGeldigheidDagen,
    factuurPrefix: ruw.factuurPrefix,
    ...(ruw.adres?.straat
      ? {
          adres: {
            straat: ruw.adres.straat ?? '',
            huisnummer: ruw.adres.huisnummer ?? '',
            postcode: ruw.adres.postcode ?? '',
            plaats: ruw.adres.plaats ?? '',
            land: ruw.adres.land ?? 'Nederland',
          },
        }
      : {}),
  };
}

/** De merkgegevens voor het sjabloon: alleen het logo als URL en de twee kleuren. */
export function naarMerkgegevens(ruw: BedrijfsinstellingenRuw) {
  const logo =
    typeof ruw.logo === 'object' && ruw.logo !== null && typeof ruw.logo.url === 'string'
      ? ruw.logo.url
      : undefined;

  return {
    ...(logo !== undefined ? { logo } : {}),
    primaireKleur: ruw.primaireKleur,
    secundaireKleur: ruw.secundaireKleur,
  };
}

/** De meest recente opgeslagen offerte van een evenement, of undefined. */
export async function haalNieuwsteOfferte(
  payload: Payload,
  evenementId: ID,
): Promise<Offerte | undefined> {
  const resultaat = await payload.find({
    collection: 'offertes',
    where: { event: { equals: naarPayloadId(evenementId) as never } },
    sort: '-versie',
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });

  const doc = resultaat.docs[0];
  if (doc === undefined) return undefined;

  return {
    id: String(doc.id),
    event: String(doc.event),
    versie: doc.versie,
    regels: (doc.regels ?? []).map((regel) => ({
      product: String(regel.product ?? ''),
      productNaam: regel.productNaam ?? '',
      aantalGasten: regel.aantalGasten ?? 0,
      hoeveelheidPerPersoon: regel.hoeveelheidPerPersoon ?? 0,
      eenheid: (regel.eenheid ?? 'gram') as Offerte['regels'][number]['eenheid'],
      prijsPerPersoon: regel.prijsPerPersoon ?? 0,
      btwTarief: String(regel.btwTarief ?? ''),
      btwPercentage: regel.btwPercentage ?? 0,
      regelTotaalExcl: regel.regelTotaalExcl ?? 0,
      btwBedrag: regel.btwBedrag ?? 0,
      regelTotaalIncl: regel.regelTotaalIncl ?? 0,
    })),
    btwUitsplitsing: (doc.btwUitsplitsing ?? []).map((regel) => ({
      btwTarief: String(regel.btwTarief ?? ''),
      naam: regel.naam ?? '',
      percentage: regel.percentage ?? 0,
      grondslag: regel.grondslag ?? 0,
      btwBedrag: regel.btwBedrag ?? 0,
    })),
    subtotaal: doc.subtotaal ?? 0,
    btwTotaal: doc.btwTotaal ?? 0,
    totaal: doc.totaal ?? 0,
    status: doc.status,
    geldigTot: String(doc.geldigTot).slice(0, 10),
    ...(doc.notities ? { notities: doc.notities } : {}),
  };
}

/**
 * Bouwt het documentmodel voor één documenttype op basis van een evenement.
 *
 * De offerte wordt uit de **opgeslagen** versie gelezen en niet opnieuw berekend: wat verzonden
 * is, hoort niet te veranderen als er later een prijs wijzigt (§3.10). Alle andere documenten
 * worden live doorgerekend, omdat die juist de actuele stand horen te tonen.
 */
export async function maakDocumentVoorEvenement(
  payload: Payload,
  type: EvenementDocumentType,
  evenementId: ID,
): Promise<DocumentModel> {
  const resultaat = await berekenEvenement(payload, evenementId);
  const { evenement, context, productie, inkoop, paklijst } = resultaat;
  const bedrijf = naarBedrijfsinstellingen(context.bedrijf);
  const klant = context.klant;

  switch (type) {
    case 'offerte': {
      const offerte = await haalNieuwsteOfferte(payload, evenementId);
      if (offerte === undefined) {
        throw new DocumentFout(
          'Er is nog geen offerte voor dit evenement. Gebruik op het rekenscherm eerst “Offerte genereren”.',
        );
      }
      return maakOfferteDocument(offerte, evenement, klant, bedrijf);
    }

    case 'productielijst':
      return maakProductielijstDocument(productie, evenement, bedrijf);

    case 'keukenlijst':
      return maakKeukenlijstDocument(productie, evenement, context.dataset.recepten, bedrijf);

    case 'inkooplijst':
      return maakInkooplijstDocument(inkoop, bedrijf);

    case 'materialenlijst':
      return maakMaterialenlijstDocument({
        evenement,
        materialen: resultaat.materialen,
        klant,
        bedrijf,
      });

    case 'paklijst':
      return maakPaklijstDocument(paklijst, evenement, klant, bedrijf);

    case 'allergenenlijst':
      return maakAllergenenlijstDocument({
        evenement,
        producten: context.dataset.producten,
        recepten: context.dataset.recepten,
        ingredienten: context.dataset.ingredienten,
        allergenen: Object.values(context.dataset.allergenen),
        klant,
        bedrijf,
      });

    default: {
      const onbekend: never = type;
      throw new Error(`Onbekend documenttype: ${String(onbekend)}`);
    }
  }
}

/** Bouwt het factuurdocument op basis van een opgeslagen factuur. */
export async function maakFactuurDocumentVoor(
  payload: Payload,
  factuurId: ID,
): Promise<DocumentModel> {
  const ruw = await payload.findByID({
    collection: 'facturen',
    id: naarPayloadId(factuurId) as never,
    depth: 0,
    overrideAccess: true,
  });

  const order = await payload.findByID({
    collection: 'orders',
    id: ruw.order as never,
    depth: 0,
    overrideAccess: true,
  });

  const evenement = await payload.findByID({
    collection: 'evenementen',
    id: order.event as never,
    depth: 0,
    overrideAccess: true,
  });

  const klantRuw = await payload.findByID({
    collection: 'klanten',
    id: evenement.klant as never,
    depth: 0,
    overrideAccess: true,
  });

  const bedrijfRuw = (await payload.findGlobal({
    slug: 'bedrijfsinstellingen',
    depth: 0,
    overrideAccess: true,
  })) as unknown as BedrijfsinstellingenRuw;

  const factuur: Factuur = {
    id: String(ruw.id),
    order: String(ruw.order),
    factuurnummer: ruw.factuurnummer,
    factuurdatum: String(ruw.factuurdatum).slice(0, 10),
    vervaldatum: String(ruw.vervaldatum).slice(0, 10),
    regels: (ruw.regels ?? []).map((regel) => ({
      omschrijving: regel.omschrijving ?? '',
      aantal: regel.aantal ?? 0,
      eenheidsprijs: regel.eenheidsprijs ?? 0,
      btwTarief: String(regel.btwTarief ?? ''),
      btwPercentage: regel.btwPercentage ?? 0,
      regelTotaalExcl: regel.regelTotaalExcl ?? 0,
      btwBedrag: regel.btwBedrag ?? 0,
      regelTotaalIncl: regel.regelTotaalIncl ?? 0,
    })),
    btwUitsplitsing: (ruw.btwUitsplitsing ?? []).map((regel) => ({
      btwTarief: String(regel.btwTarief ?? ''),
      naam: regel.naam ?? '',
      percentage: regel.percentage ?? 0,
      grondslag: regel.grondslag ?? 0,
      btwBedrag: regel.btwBedrag ?? 0,
    })),
    subtotaal: ruw.subtotaal ?? 0,
    btwTotaal: ruw.btwTotaal ?? 0,
    totaal: ruw.totaal ?? 0,
    status: ruw.status,
  };

  const klant = {
    id: String(klantRuw.id),
    naam: klantRuw.naam,
    ...(klantRuw.contactpersoon ? { contactpersoon: klantRuw.contactpersoon } : {}),
    ...(klantRuw.email ? { email: klantRuw.email } : {}),
    ...(klantRuw.btwNummer ? { btwNummer: klantRuw.btwNummer } : {}),
    ...(klantRuw.adres?.straat
      ? {
          adres: {
            straat: klantRuw.adres.straat ?? '',
            huisnummer: klantRuw.adres.huisnummer ?? '',
            postcode: klantRuw.adres.postcode ?? '',
            plaats: klantRuw.adres.plaats ?? '',
            land: klantRuw.adres.land ?? 'Nederland',
          },
        }
      : {}),
    ...(klantRuw.factuuradres?.straat
      ? {
          factuuradres: {
            straat: klantRuw.factuuradres.straat ?? '',
            huisnummer: klantRuw.factuuradres.huisnummer ?? '',
            postcode: klantRuw.factuuradres.postcode ?? '',
            plaats: klantRuw.factuuradres.plaats ?? '',
            land: klantRuw.factuuradres.land ?? 'Nederland',
          },
        }
      : {}),
  };

  return maakFactuurDocument(factuur, klant, naarBedrijfsinstellingen(bedrijfRuw));
}

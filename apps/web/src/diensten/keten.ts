import {
  aggregeerInkoop,
  allergenenDetails,
  allergenenVanProduct,
  berekenEvenementProductie,
  berekenMaterialen,
  datumPlusDagen,
  maakOfferteSnapshot,
  maakPaklijst,
  type EvenementProductie,
} from '@foodbook/calculation-engine';
import type {
  Allergeen,
  Evenement,
  ID,
  Inkoop,
  MateriaalBehoefte,
  Offerte,
  Picking,
} from '@foodbook/shared-types';
import type { Payload } from 'payload';

import { haalEvenementContext, type EvenementContext } from './dataset';
import { naarPayloadId } from './ids';

/**
 * De keten: van evenement naar offerte, productie, inkoop en paklijst.
 *
 * Dit is de laag die de rekenmotor daadwerkelijk aanroept. De motor zelf leest nooit uit de
 * database en schrijft er ook nooit in; alles wat met opslag te maken heeft gebeurt hier.
 */

export interface AllergenenPerProduct {
  product: ID;
  naam: string;
  allergenen: Allergeen[];
}

export interface Rekenresultaat {
  evenement: Evenement;
  context: EvenementContext;
  productie: EvenementProductie;
  inkoop: Inkoop;
  /** Materiaalbehoefte: automatisch uit de gerechten plus handmatige aanvulling (B14). */
  materialen: MateriaalBehoefte[];
  paklijst: Omit<Picking, 'id'>;
  /** De offerte zoals hij zou worden als je hem nu zou genereren. Nog niet opgeslagen. */
  offerte: Omit<Offerte, 'id'>;
  allergenenPerProduct: AllergenenPerProduct[];
  /** Kostprijs van alle ingrediënten samen. */
  kostprijs: number;
  /** Verkoop exclusief btw min kostprijs. */
  marge: number;
  margePercentage: number;
}

/**
 * Rekent één evenement volledig door. Schrijft niets weg: dit is wat het rekenscherm toont,
 * zodat je eerst kunt kijken of het klopt voordat je er een offerte van maakt.
 */
export async function berekenEvenement(
  payload: Payload,
  evenementId: ID,
): Promise<Rekenresultaat> {
  const context = await haalEvenementContext(payload, evenementId);
  const { dataset, bedrijf } = context;
  const { evenement, producten, recepten, ingredienten, allergenen, btwTarieven, materialen } =
    dataset;

  const productie = berekenEvenementProductie(evenement, producten, { recepten, ingredienten });

  const offerte = maakOfferteSnapshot(evenement, producten, recepten, btwTarieven, {
    versie: 1,
    geldigTot: datumPlusDagen(evenement.datum, bedrijf.offerteGeldigheidDagen),
  });

  const inkoop = aggregeerInkoop([productie], ingredienten, dataset.leveranciers ?? {}, {
    periodeVan: evenement.datum,
    periodeTot: evenement.datum,
  });

  // Materiaal eerst bepalen: de paklijst heeft de volledige behoefte nodig, inclusief wat
  // automatisch uit de gerechten volgt (B14).
  const materiaalBehoefte = berekenMaterialen(evenement, producten, materialen ?? {});

  const paklijst = maakPaklijst(productie, materiaalBehoefte);

  const allergenenPerProduct: AllergenenPerProduct[] = evenement.producten
    .map((regel) => producten[regel.product])
    .filter((product) => product !== undefined)
    .map((product) => ({
      product: product.id,
      naam: product.naam,
      allergenen: allergenenDetails(allergenenVanProduct(product, recepten, ingredienten), allergenen),
    }));

  const kostprijs = productie.regels.reduce((som, regel) => som + regel.kostprijs, 0);
  const marge = offerte.subtotaal - kostprijs;

  return {
    evenement,
    context,
    productie,
    inkoop,
    materialen: materiaalBehoefte,
    paklijst,
    offerte,
    allergenenPerProduct,
    kostprijs,
    marge,
    margePercentage: offerte.subtotaal === 0 ? 0 : (marge / offerte.subtotaal) * 100,
  };
}

/**
 * Maakt van het doorgerekende evenement een **bevroren** offerte en slaat hem op (§3.10).
 *
 * Vanaf dit moment leest de offerte het product niet meer: een latere prijswijziging verandert
 * een verzonden offerte niet met terugwerkende kracht. Het versienummer wordt door een hook op
 * de collectie bepaald, zodat elke nieuwe offerte voor hetzelfde evenement een versie opschuift.
 */
export async function genereerOfferte(
  payload: Payload,
  evenementId: ID,
  opties: { notities?: string } = {},
): Promise<Offerte> {
  const resultaat = await berekenEvenement(payload, evenementId);

  const aangemaakt = await payload.create({
    collection: 'offertes',
    data: {
      event: naarPayloadId(evenementId) as never,
      versie: resultaat.offerte.versie,
      regels: resultaat.offerte.regels.map((regel) => ({
        product: regel.product,
        productNaam: regel.productNaam,
        aantalGasten: regel.aantalGasten,
        hoeveelheidPerPersoon: regel.hoeveelheidPerPersoon,
        eenheid: regel.eenheid,
        prijsPerPersoon: regel.prijsPerPersoon,
        btwTarief: regel.btwTarief,
        btwPercentage: regel.btwPercentage,
        regelTotaalExcl: regel.regelTotaalExcl,
        btwBedrag: regel.btwBedrag,
        regelTotaalIncl: regel.regelTotaalIncl,
      })),
      btwUitsplitsing: resultaat.offerte.btwUitsplitsing.map((regel) => ({
        btwTarief: regel.btwTarief,
        naam: regel.naam,
        percentage: regel.percentage,
        grondslag: regel.grondslag,
        btwBedrag: regel.btwBedrag,
      })),
      subtotaal: resultaat.offerte.subtotaal,
      btwTotaal: resultaat.offerte.btwTotaal,
      totaal: resultaat.offerte.totaal,
      status: 'concept',
      geldigTot: resultaat.offerte.geldigTot,
      ...(opties.notities !== undefined ? { notities: opties.notities } : {}),
    },
    overrideAccess: true,
  });

  await payload.update({
    collection: 'evenementen',
    id: naarPayloadId(evenementId) as never,
    data: { status: 'offerte_verzonden' },
    overrideAccess: true,
  });

  return aangemaakt as unknown as Offerte;
}

/** De eerstvolgende factuurdatum en vervaldatum, op basis van de ingestelde betaaltermijn. */
export function bepaalFactuurdatums(
  bedrijf: { betalingstermijnDagen: number },
  peildatum: string,
): { factuurdatum: string; vervaldatum: string } {
  return {
    factuurdatum: peildatum,
    vervaldatum: datumPlusDagen(peildatum, bedrijf.betalingstermijnDagen),
  };
}

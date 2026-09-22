import type {
  BtwTarief,
  Evenement,
  Offerte,
  OfferteRegel,
  Product,
  Recept,
} from '@foodbook/shared-types';
import { berekenTotalen } from './btw';
import { haalOp } from './errors';
import { rondGeldAf } from './rounding';
import { berekenPorties } from './scaling';

export interface OfferteOpties {
  versie: number;
  geldigTot: string;
  notities?: string;
}

/**
 * §3.10/§4.2 — maakt een **bevroren** offertesnapshot van een evenement.
 *
 * De regels worden hier één keer uitgerekend en daarna als platte data opgeslagen. Dat is de
 * reden dat een latere prijswijziging op een product een al verzonden offerte niet met
 * terugwerkende kracht verandert: de offerte leest het product daarna niet meer.
 */
export function maakOfferteSnapshot(
  evenement: Evenement,
  producten: Record<string, Product>,
  recepten: Record<string, Recept>,
  btwTarieven: Record<string, BtwTarief>,
  opties: OfferteOpties,
): Omit<Offerte, 'id'> {
  const regels: OfferteRegel[] = evenement.producten.map((eventRegel) => {
    const product = haalOp(producten, eventRegel.product, 'Product');
    const tarief = haalOp(btwTarieven, product.btwTarief, 'Btw-tarief');
    const recept = product.recept === undefined ? undefined : recepten[product.recept];
    const porties = berekenPorties(product, eventRegel, evenement, recept);

    const regelTotaalExcl = rondGeldAf(product.prijsPerPersoon * porties.aantalGasten);
    const btwBedrag = rondGeldAf((regelTotaalExcl * tarief.percentage) / 100);

    return {
      product: product.id,
      productNaam: product.naam,
      aantalGasten: porties.aantalGasten,
      hoeveelheidPerPersoon: porties.hoeveelheidPerPersoon,
      eenheid: product.eenheid,
      prijsPerPersoon: product.prijsPerPersoon,
      btwTarief: tarief.id,
      btwPercentage: tarief.percentage,
      regelTotaalExcl,
      btwBedrag,
      regelTotaalIncl: rondGeldAf(regelTotaalExcl + btwBedrag),
    };
  });

  const totalen = berekenTotalen(
    regels.map((regel) => ({ bedragExcl: regel.regelTotaalExcl, btwTarief: regel.btwTarief })),
    btwTarieven,
  );

  return {
    event: evenement.id,
    versie: opties.versie,
    regels,
    btwUitsplitsing: totalen.btwUitsplitsing,
    subtotaal: totalen.subtotaal,
    btwTotaal: totalen.btwTotaal,
    totaal: totalen.totaal,
    status: 'concept',
    geldigTot: opties.geldigTot,
    ...(opties.notities !== undefined ? { notities: opties.notities } : {}),
  };
}

/**
 * §3.10 — een offerte die na verzending inhoudelijk wijzigt, wordt een nieuwe versie.
 * De oude versie blijft bestaan; het versienummer loopt op.
 */
export function nieuweOfferteVersie(huidige: Offerte): number {
  return huidige.versie + 1;
}

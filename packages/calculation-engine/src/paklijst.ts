import type { MateriaalBehoefte, PaklijstRegel, Picking } from '@foodbook/shared-types';
import type { EvenementProductie } from './productie';

/**
 * §3.14 — de gecombineerde paklijst: voedsel uit de productie en materialen uit de
 * materiaalberekening, in één afvinkbare lijst. In v1 zijn picking en levering bewust één
 * module (§8).
 *
 * De materialen komen uit `berekenMaterialen` (B14) en niet rechtstreeks uit het evenement: daar
 * zit ook het materiaal in dat automatisch uit de gekozen gerechten volgt. Alleen de handmatige
 * regels meenemen zou betekenen dat de borden en het bestek niet op de paklijst staan.
 */
export function maakPaklijst(
  productie: EvenementProductie,
  materialen: MateriaalBehoefte[],
): Omit<Picking, 'id'> {
  const voedsel: PaklijstRegel[] = productie.regels.map((regel) => ({
    soort: 'voedsel',
    referentie: regel.product,
    omschrijving: regel.productNaam,
    hoeveelheid: regel.productHoeveelheid,
    eenheid: regel.eenheid,
    afgevinkt: false,
  }));

  const materiaalRegels: PaklijstRegel[] = materialen
    .filter((regel) => regel.totaal > 0)
    .map((regel) => ({
      soort: 'materiaal',
      referentie: regel.materiaal,
      omschrijving: regel.naam,
      hoeveelheid: regel.totaal,
      eenheid: regel.eenheid,
      afgevinkt: false,
    }));

  return {
    order: productie.evenement,
    regels: [...voedsel, ...materiaalRegels],
    status: 'open',
  };
}

/** Vinkt één paklijstregel af. Retourneert een nieuwe lijst; muteert de invoer niet. */
export function vinkRegelAf(picking: Picking, index: number): Picking {
  return {
    ...picking,
    regels: picking.regels.map((regel, i) =>
      i === index ? { ...regel, afgevinkt: !regel.afgevinkt } : regel,
    ),
  };
}

/** Wanneer alle regels zijn afgevinkt is de paklijst klaar. */
export function isPaklijstCompleet(picking: Picking): boolean {
  return picking.regels.every((regel) => regel.afgevinkt);
}

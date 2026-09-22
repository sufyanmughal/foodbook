import type {
  Evenement,
  ID,
  Materiaal,
  MateriaalBehoefte,
  Product,
} from '@foodbook/shared-types';
import { RekenFout, haalOp } from './errors';
import { berekenPorties } from './scaling';

/**
 * B14 — materiaalbehoefte van een evenement.
 *
 * Voedsel loopt via recepten naar productie en inkoop; materialen lopen via deze functie naar de
 * materialenlijst. Het zijn twee losse sporen met een eigen document, zoals de klant vroeg.
 *
 * De behoefte komt uit twee bronnen die bij elkaar worden opgeteld:
 *
 * 1. **Automatisch** — materiaalregels op de producten die op het evenement staan. Een bord per
 *    gast, een warmhoudplaat per vijftig gasten. Dit schaalt mee met het aantal gasten, en met
 *    de gastenoverride per regel: een kinderfeest met een aparte kindermenukaart vraagt om
 *    andere aantallen borden voor dat deel van het gezelschap.
 * 2. **Handmatig** — wat er per evenement is toegevoegd of bijgesteld. Extra kratten, een paar
 *    reserve-borden, dingen die je vooraf niet kunt weten.
 *
 * Er wordt naar boven afgerond op hele stuks: een halve warmhoudplaat bestaat niet, en te weinig
 * materiaal is erger dan één te veel.
 */
export function berekenMaterialen(
  evenement: Evenement,
  producten: Record<ID, Product>,
  materialen: Record<ID, Materiaal>,
): MateriaalBehoefte[] {
  const verzameld = new Map<ID, MateriaalBehoefte>();

  const zorgVoor = (materiaal: Materiaal): MateriaalBehoefte => {
    const bestaand = verzameld.get(materiaal.id);
    if (bestaand !== undefined) return bestaand;

    const nieuw: MateriaalBehoefte = {
      materiaal: materiaal.id,
      naam: materiaal.naam,
      eenheid: materiaal.eenheid,
      automatisch: 0,
      handmatig: 0,
      totaal: 0,
      herkomst: [],
    };
    verzameld.set(materiaal.id, nieuw);
    return nieuw;
  };

  // 1. Automatisch, uit de materiaalregels van de gekozen producten.
  evenement.producten.forEach((eventRegel, index) => {
    const product = haalOp(producten, eventRegel.product, 'Product');
    const regels = product.materialen ?? [];
    if (regels.length === 0) return;

    // Hetzelfde gastenaantal als waarop het eten wordt geschaald, inclusief een override per
    // regel. Zo lopen voedsel en materiaal niet uit elkaar bij een deel van het gezelschap.
    const porties = berekenPorties(product, evenement.producten[index], evenement);
    const gasten = porties.aantalGasten;

    for (const regel of regels) {
      if (!Number.isFinite(regel.hoeveelheid) || regel.hoeveelheid < 0) {
        throw new RekenFout(
          `Ongeldige materiaalhoeveelheid op product "${product.naam}": ${String(regel.hoeveelheid)}.`,
        );
      }
      if (!Number.isFinite(regel.perAantalGasten) || regel.perAantalGasten <= 0) {
        throw new RekenFout(
          `Ongeldig aantal gasten per materiaal op product "${product.naam}": ${String(regel.perAantalGasten)}.`,
        );
      }

      const materiaal = haalOp(materialen, regel.materiaal, 'Materiaal');
      const behoefte = zorgVoor(materiaal);

      const aantal = Math.ceil((regel.hoeveelheid * gasten) / regel.perAantalGasten);
      behoefte.automatisch += aantal;

      if (!behoefte.herkomst.includes(product.naam)) {
        behoefte.herkomst.push(product.naam);
      }
    }
  });

  // 2. Handmatig, per evenement toegevoegd of bijgesteld.
  for (const regel of evenement.materialen) {
    const materiaal = haalOp(materialen, regel.materiaal, 'Materiaal');
    zorgVoor(materiaal).handmatig += regel.aantal;
  }

  for (const behoefte of verzameld.values()) {
    behoefte.totaal = behoefte.automatisch + behoefte.handmatig;
    // Vaste volgorde, zodat hetzelfde evenement altijd hetzelfde document oplevert.
    behoefte.herkomst.sort((a, b) => a.localeCompare(b, 'nl'));
  }

  return [...verzameld.values()].sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));
}

import type {
  BtwTarief,
  Factuur,
  FactuurRegel,
  Offerte,
  OfferteRegel,
} from '@foodbook/shared-types';
import { berekenTotalen } from './btw';
import { RekenFout } from './errors';
import { rondGeldAf } from './rounding';

export interface FactuurOpties {
  order: string;
  factuurnummer: string;
  factuurdatum: string;
  betalingstermijnDagen: number;
  creditVan?: string;
}

/** Telt kalenderdagen op bij een ISO-datum (jjjj-mm-dd). */
export function datumPlusDagen(isoDatum: string, dagen: number): string {
  const datum = new Date(`${isoDatum}T00:00:00Z`);
  if (Number.isNaN(datum.getTime())) {
    throw new RekenFout(`Ongeldige datum: "${isoDatum}".`);
  }
  datum.setUTCDate(datum.getUTCDate() + dagen);
  return datum.toISOString().slice(0, 10);
}

/** Zet een bevroren offerteregel om naar een factuurregel. */
function offerteRegelNaarFactuurRegel(regel: OfferteRegel): FactuurRegel {
  const btwBedrag = rondGeldAf((regel.regelTotaalExcl * regel.btwPercentage) / 100);
  return {
    omschrijving: `${regel.productNaam} — ${regel.aantalGasten} gasten × ${regel.hoeveelheidPerPersoon} ${regel.eenheid} à ${regel.prijsPerPersoon}`,
    aantal: regel.aantalGasten,
    eenheidsprijs: regel.prijsPerPersoon,
    btwTarief: regel.btwTarief,
    btwPercentage: regel.btwPercentage,
    regelTotaalExcl: regel.regelTotaalExcl,
    btwBedrag,
    regelTotaalIncl: rondGeldAf(regel.regelTotaalExcl + btwBedrag),
  };
}

/**
 * §3.16 — factuursnapshot. Neemt de **geaccepteerde offerteversie** als bron, niet het
 * levende evenement: wat gefactureerd wordt is wat er is afgesproken, niet wat er daarna
 * nog is gewijzigd.
 */
export function maakFactuurSnapshot(
  geaccepteerdeOfferte: Offerte,
  btwTarieven: Record<string, BtwTarief>,
  opties: FactuurOpties,
): Omit<Factuur, 'id'> {
  if (geaccepteerdeOfferte.regels.length === 0) {
    throw new RekenFout('Kan geen factuur maken van een offerte zonder regels.');
  }

  const regels = geaccepteerdeOfferte.regels.map(offerteRegelNaarFactuurRegel);
  const totalen = berekenTotalen(
    regels.map((regel) => ({ bedragExcl: regel.regelTotaalExcl, btwTarief: regel.btwTarief })),
    btwTarieven,
  );

  return {
    order: opties.order,
    factuurnummer: opties.factuurnummer,
    factuurdatum: opties.factuurdatum,
    vervaldatum: datumPlusDagen(opties.factuurdatum, opties.betalingstermijnDagen),
    regels,
    btwUitsplitsing: totalen.btwUitsplitsing,
    subtotaal: totalen.subtotaal,
    btwTotaal: totalen.btwTotaal,
    totaal: totalen.totaal,
    status: 'concept',
    ...(opties.creditVan !== undefined ? { creditVan: opties.creditVan } : {}),
  };
}

export interface FactuurnummerFormaat {
  prefix: string;
  jaar: number;
}

/**
 * §3.16 — bepaalt het volgende factuurnummer: oplopend, zonder gaten.
 *
 * Er wordt gekeken naar de hoogste bestaande reeks binnen hetzelfde jaar én dezelfde prefix,
 * niet naar het aantal facturen. Een verwijderde of gecrediteerde factuur mag het nummer
 * dus nooit opnieuw uitgeven; crediteren gebeurt met een eigen nieuw nummer.
 */
export function bepaalVolgendFactuurNummer(
  bestaandeNummers: string[],
  formaat: FactuurnummerFormaat,
): string {
  const patroon = new RegExp(`^${escapeRegex(formaat.prefix)}${formaat.jaar}-(\\d+)$`);
  let hoogste = 0;

  for (const nummer of bestaandeNummers) {
    const match = patroon.exec(nummer);
    if (match?.[1] === undefined) continue;
    const reeks = Number.parseInt(match[1], 10);
    if (reeks > hoogste) hoogste = reeks;
  }

  return `${formaat.prefix}${formaat.jaar}-${String(hoogste + 1).padStart(4, '0')}`;
}

function escapeRegex(waarde: string): string {
  return waarde.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** §3.16 — facturen die over de vervaldatum zijn en nog niet betaald: "te laat". */
export function isTeLaat(factuur: Factuur, peildatum: string): boolean {
  return factuur.status !== 'betaald' && factuur.vervaldatum < peildatum;
}

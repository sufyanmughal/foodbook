import type { BtwTarief, BtwUitsplitsing, ID } from '@foodbook/shared-types';
import { haalOp } from './errors';
import { rondGeldAf } from './rounding';

export interface BtwRegelInput {
  /** Bedrag exclusief btw. */
  bedragExcl: number;
  btwTarief: ID;
}

export interface Totalen {
  btwUitsplitsing: BtwUitsplitsing[];
  subtotaal: number;
  btwTotaal: number;
  totaal: number;
}

/**
 * §3.10/§3.16 — btw wordt per tarief uitgesplitst, niet alleen als totaal.
 *
 * De btw per tarief wordt berekend over de *grondslag van dat tarief* (niet per losse regel),
 * en daarna op hele eurocenten afgerond. Dat is de gebruikelijke werkwijze op een Nederlandse
 * factuur met gemengde tarieven en voorkomt afrondingsverschillen van een cent per regel.
 */
export function berekenTotalen(
  regels: BtwRegelInput[],
  tarieven: Record<ID, BtwTarief>,
): Totalen {
  const grondslagPerTarief = new Map<ID, number>();

  for (const regel of regels) {
    grondslagPerTarief.set(
      regel.btwTarief,
      (grondslagPerTarief.get(regel.btwTarief) ?? 0) + regel.bedragExcl,
    );
  }

  const btwUitsplitsing: BtwUitsplitsing[] = [];
  for (const [tariefId, grondslag] of grondslagPerTarief) {
    const tarief = haalOp(tarieven, tariefId, 'Btw-tarief');
    const afgerondeGrondslag = rondGeldAf(grondslag);
    btwUitsplitsing.push({
      btwTarief: tarief.id,
      naam: tarief.naam,
      percentage: tarief.percentage,
      grondslag: afgerondeGrondslag,
      btwBedrag: rondGeldAf((afgerondeGrondslag * tarief.percentage) / 100),
    });
  }

  btwUitsplitsing.sort((a, b) => a.percentage - b.percentage);

  const subtotaal = rondGeldAf(
    btwUitsplitsing.reduce((som, regel) => som + regel.grondslag, 0),
  );
  const btwTotaal = rondGeldAf(btwUitsplitsing.reduce((som, regel) => som + regel.btwBedrag, 0));

  return {
    btwUitsplitsing,
    subtotaal,
    btwTotaal,
    totaal: rondGeldAf(subtotaal + btwTotaal),
  };
}

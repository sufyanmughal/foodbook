import config from '@payload-config';
import { formatteerHoeveelheid } from '@foodbook/i18n';
import { getPayload } from 'payload';
import type { Payload } from 'payload';

import { berekenEvenement, genereerOfferte } from './diensten/keten';
import { naarPayloadId } from './diensten/ids';

/**
 * De acceptatietest zoals afgesproken met de klant.
 *
 * Draait de volledige keten voor één evenement en controleert de twee scenario's die expliciet
 * zijn afgesproken:
 *
 *   1. 250 gasten → 300 gasten: alles stroomafwaarts moet meeschalen.
 *   2. Zalm van 180 gram → 160 gram per persoon: de hoeveelheden moeten meebewegen.
 *
 * Daarnaast wordt gecontroleerd dat een **bevroren offerte** niet verandert wanneer er daarna
 * iets aan een product wijzigt — dat is de kern van de juridische houdbaarheid van het systeem.
 *
 * De waarden worden aan het eind teruggezet, zodat de test herhaalbaar is.
 *
 * Uitvoeren: npm run acceptatietest -w @foodbook/web
 */

interface Meting {
  gasten: number;
  zalmGram: number;
  zalmProductGram: number;
  ingrediëntTotaal: number;
  verkoopExcl: number;
  btw: number;
  totaal: number;
}

/** Een relatieveld is bij `depth: 0` een id, maar kan ook een uitgeklapt object zijn. */
function idVan(waarde: unknown): string {
  if (typeof waarde === 'object' && waarde !== null && 'id' in waarde) {
    return String((waarde as { id: unknown }).id);
  }
  return String(waarde);
}

const payload: Payload = await getPayload({ config });

const evenementen = await payload.find({
  collection: 'evenementen',
  limit: 1,
  depth: 0,
  overrideAccess: true,
});
const evenement = evenementen.docs[0];

if (evenement === undefined) {
  console.error('Geen evenement gevonden. Draai eerst: npm run seed:demo -w @foodbook/web');
  process.exit(1);
}

const evenementId = String(evenement.id);
const productenVanEvenement = (evenement.producten ?? []).map((regel) => idVan(regel.product));

// Het product met een recept — dat is het product waar de gram-per-persoon op zit.
const producten = await payload.find({
  collection: 'producten',
  where: { id: { in: productenVanEvenement.map((id) => naarPayloadId(id)) as never } },
  depth: 0,
  overrideAccess: true,
});
const zalmProduct = producten.docs.find((p) => p.recept !== null && p.recept !== undefined);

if (zalmProduct === undefined) {
  console.error('Geen product met recept gevonden; deze test heeft er één nodig.');
  process.exit(1);
}

const zalmProductId = String(zalmProduct.id);
const oorspronkelijkGasten = evenement.aantalGasten;
const oorspronkelijkGram = zalmProduct.hoeveelheidPerPersoon;

async function meten(): Promise<Meting> {
  const resultaat = await berekenEvenement(payload, evenementId);

  const zalmRegel = resultaat.productie.regels.find((r) => r.product === zalmProductId);
  const zalmIngrediënt = zalmRegel?.ingredienten.reduce((som, i) => som + i.hoeveelheid, 0) ?? 0;

  return {
    gasten: resultaat.evenement.aantalGasten,
    zalmGram: zalmRegel?.hoeveelheidPerPersoon ?? 0,
    zalmProductGram: zalmRegel?.productHoeveelheid ?? 0,
    ingrediëntTotaal: zalmIngrediënt,
    verkoopExcl: resultaat.offerte.subtotaal,
    btw: resultaat.offerte.btwTotaal,
    totaal: resultaat.offerte.totaal,
  };
}

function toon(meting: Meting): void {
  console.log(
    `  ${String(meting.gasten).padStart(3)} gasten · zalm ${String(meting.zalmGram).padStart(3)} g p.p. · ` +
      `producthoeveelheid ${formatteerHoeveelheid(meting.zalmProductGram, 'gram').padStart(12)} · ` +
      `ingrediënten ${formatteerHoeveelheid(meting.ingrediëntTotaal, 'gram').padStart(12)} · ` +
      `verkoop € ${meting.verkoopExcl.toFixed(2).padStart(8)} · btw € ${meting.btw.toFixed(2).padStart(7)} · totaal € ${meting.totaal.toFixed(2)}`,
  );
}

console.log(`\nEvenement: ${evenement.titel}\n`);

// ─────────────────────────────────────────────────────────────────────────────
// 0. Uitgangssituatie
// ─────────────────────────────────────────────────────────────────────────────
console.log('Uitgangssituatie');
const basis = await meten();
toon(basis);

// ─────────────────────────────────────────────────────────────────────────────
// 1. Gastenaantal 250 → 300
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nStap 1 — gastenaantal 250 → 300');
await payload.update({
  collection: 'evenementen',
  id: naarPayloadId(evenementId) as never,
  data: { aantalGasten: 300 },
  overrideAccess: true,
});
const naGasten = await meten();
toon(naGasten);

const factor = 300 / basis.gasten;
const gastenOk =
  Math.abs(naGasten.zalmProductGram - basis.zalmProductGram * factor) < 0.01 &&
  Math.abs(naGasten.ingrediëntTotaal - basis.ingrediëntTotaal * factor) < 0.01 &&
  Math.abs(naGasten.totaal - basis.totaal * factor) < 0.01;
console.log(`  schaalt alles met factor ${factor.toFixed(2)}? ${gastenOk ? 'JA' : 'NEE'}`);

// ─────────────────────────────────────────────────────────────────────────────
// 2. Zalm 180 → 160 gram per persoon
// ─────────────────────────────────────────────────────────────────────────────
console.log(`\nStap 2 — zalm ${oorspronkelijkGram} → 160 gram per persoon (bij 300 gasten)`);
await payload.update({
  collection: 'producten',
  id: naarPayloadId(zalmProductId) as never,
  data: { hoeveelheidPerPersoon: 160 },
  overrideAccess: true,
});
const naGram = await meten();
toon(naGram);

const gramFactor = 160 / oorspronkelijkGram;
const gramOk =
  Math.abs(naGram.ingrediëntTotaal - naGasten.ingrediëntTotaal * gramFactor) < 0.01 &&
  Math.abs(naGram.zalmProductGram - naGasten.zalmProductGram * gramFactor) < 0.01;
console.log(`  schalen de ingrediënten mee met factor ${gramFactor.toFixed(3)}? ${gramOk ? 'JA' : 'NEE'}`);
console.log(
  `  blijft de verkoopprijs gelijk (prijs is een ondernemersbeslissing, §4.2)? ${naGram.totaal === naGasten.totaal ? 'JA' : 'NEE'}`,
);

// ─────────────────────────────────────────────────────────────────────────────
// 3. Bevroren offerte verandert niet met terugwerkende kracht
// ─────────────────────────────────────────────────────────────────────────────
console.log('\nStap 3 — bevroren offerte blijft staan na een prijswijziging');
const offerteVoor = await genereerOfferte(payload, evenementId);

await payload.update({
  collection: 'producten',
  id: naarPayloadId(zalmProductId) as never,
  data: { prijsPerPersoon: 99 },
  overrideAccess: true,
});

const offerteNa = await payload.findByID({
  collection: 'offertes',
  id: naarPayloadId(offerteVoor.id) as never,
  depth: 0,
  overrideAccess: true,
});
const bevrorenOk = (offerteNa.totaal ?? 0) === offerteVoor.totaal;
console.log(`  offertetotaal voor wijziging: € ${offerteVoor.totaal.toFixed(2)}`);
console.log(`  offertetotaal na wijziging:   € ${(offerteNa.totaal ?? 0).toFixed(2)}`);
console.log(`  ongewijzigd? ${bevrorenOk ? 'JA' : 'NEE'}`);

// ─────────────────────────────────────────────────────────────────────────────
// Opruimen: alles terug naar de oorspronkelijke waarden
// ─────────────────────────────────────────────────────────────────────────────
await payload.update({
  collection: 'producten',
  id: naarPayloadId(zalmProductId) as never,
  data: { hoeveelheidPerPersoon: oorspronkelijkGram, prijsPerPersoon: zalmProduct.prijsPerPersoon },
  overrideAccess: true,
});
await payload.update({
  collection: 'evenementen',
  id: naarPayloadId(evenementId) as never,
  data: { aantalGasten: oorspronkelijkGasten },
  overrideAccess: true,
});

console.log('\n─── Uitslag ───');
console.log(`  Gastenaantal schaalt alles mee:   ${gastenOk ? 'GESLAAGD' : 'MISLUKT'}`);
console.log(`  Gram per persoon schaalt mee:     ${gramOk ? 'GESLAAGD' : 'MISLUKT'}`);
console.log(`  Bevroren offerte blijft staan:    ${bevrorenOk ? 'GESLAAGD' : 'MISLUKT'}`);
console.log('\nWaarden zijn teruggezet naar de oorspronkelijke situatie.\n');

process.exit(gastenOk && gramOk && bevrorenOk ? 0 : 1);

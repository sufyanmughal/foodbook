import type {
  Allergeen,
  BtwTarief,
  Evenement,
  ID,
  Ingredient,
  Klant,
  Leverancier,
  Materiaal,
  Product,
  Recept,
  RekenDataset,
} from '@foodbook/shared-types';
import { indexeer } from '@foodbook/shared-types';
import type { Payload } from 'payload';

import { naarPayloadId, naarPayloadIds } from './ids';

/**
 * Bouwt de dataset die de rekenmotor nodig heeft uit de database.
 *
 * De rekenmotor leest bewust nooit zelf uit de database (ARCHITECTURE.md §4): hij krijgt één
 * onveranderlijke momentopname mee. Deze module is de enige plek waar die momentopname wordt
 * samengesteld, zodat de motor puur en los testbaar blijft.
 *
 * Er wordt gericht opgehaald — alleen de producten van dit evenement, hun recepten en de
 * ingrediënten daarin — in plaats van de hele catalogus. Dat houdt het werken met een grote
 * kaart snel.
 */

/** Payload geeft bij SQLite een nummer en bij PostgreSQL een UUID; de motor rekent met strings. */
const alsId = (waarde: number | string): ID => String(waarde);

function idVan(waarde: number | string | { id: number | string } | null | undefined): ID | undefined {
  if (waarde === null || waarde === undefined) return undefined;
  return typeof waarde === 'object' ? alsId(waarde.id) : alsId(waarde);
}

function idsVan(waarden: (number | string | { id: number | string })[] | null | undefined): ID[] {
  return (waarden ?? []).map((waarde) => alsId(typeof waarde === 'object' ? waarde.id : waarde));
}

/**
 * Een record zoals Payload het teruggeeft. De relatievelden zijn bij `depth: 0` gewoon id's,
 * maar TypeScript weet dat niet — vandaar een losse vorm. De omzetting naar de strikte typen
 * van de rekenmotor gebeurt hieronder in de `map…`-functies, die één plek vormen waar dat
 * gecontroleerd gebeurt.
 */
type RuwRecord = Record<string, any>;

/** Haalt records op waarvan de id in de lijst staat; slaat de query over als de lijst leeg is. */
async function haalOp(
  payload: Payload,
  collection: Parameters<Payload['find']>[0]['collection'],
  ids: ID[],
): Promise<RuwRecord[]> {
  if (ids.length === 0) return [];
  const resultaat = await payload.find({
    collection,
    where: { id: { in: naarPayloadIds(ids) as never } },
    depth: 0,
    pagination: false,
    overrideAccess: true,
  });
  return resultaat.docs as unknown as RuwRecord[];
}

/** Alles wat de motor nodig heeft, plus de klant en bedrijfsgegevens voor de documenten. */
export interface EvenementContext {
  dataset: RekenDataset;
  klant: Klant;
  bedrijf: BedrijfsinstellingenRuw;
}

/** De bedrijfsinstellingen zoals Payload ze teruggeeft (een global, geen collectie). */
export interface BedrijfsinstellingenRuw {
  naam: string;
  kvkNummer: string;
  btwNummer: string;
  iban: string;
  email: string;
  telefoon?: string | null;
  primaireKleur: string;
  secundaireKleur: string;
  standaardVoettekst: string;
  betalingstermijnDagen: number;
  offerteGeldigheidDagen: number;
  factuurPrefix: string;
  adres?: { straat?: string | null; huisnummer?: string | null; postcode?: string | null; plaats?: string | null; land?: string | null } | null;
  logo?: number | string | { url?: string } | null;
}

/** Haalt één evenement op met alles wat de motor nodig heeft om het door te rekenen. */
export async function haalEvenementContext(
  payload: Payload,
  evenementId: ID,
): Promise<EvenementContext> {
  const evenementRuw = await payload.findByID({
    collection: 'evenementen',
    id: naarPayloadId(evenementId) as never,
    depth: 0,
    overrideAccess: true,
  });

  const productIds = idsVan(evenementRuw.producten?.map((regel) => regel.product));

  // Materialen staan op twee plekken: als handmatige regel op het evenement, én als
  // materiaalregel op een product (B14). Beide moeten worden opgehaald, anders kent de motor
  // een materiaal niet waar een gerecht om vraagt.
  const [productenRuw, allergenenRuw, btwRuw, leveranciersRuw, klantRuw] = await Promise.all([
    haalOp(payload, 'producten', productIds),
    payload.find({ collection: 'allergenen', pagination: false, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'btw-tarieven', pagination: false, depth: 0, overrideAccess: true }),
    payload.find({ collection: 'leveranciers', pagination: false, depth: 0, overrideAccess: true }),
    payload.findByID({
      collection: 'klanten',
      id: evenementRuw.klant as never,
      depth: 0,
      overrideAccess: true,
    }),
  ]);

  const materiaalIds = [
    ...new Set([
      ...idsVan(evenementRuw.materialen?.map((regel) => regel.materiaal)),
      ...productenRuw.flatMap((product: RuwRecord) =>
        ((product.materialen ?? []) as RuwRecord[])
          .map((regel: RuwRecord) => idVan(regel.materiaal as never))
          .filter((id: ID | undefined): id is ID => id !== undefined),
      ),
    ]),
  ];
  const materialenRuw = await haalOp(payload, 'materialen', materiaalIds);

  const receptIds = productenRuw
    .map((product) => idVan(product.recept as never))
    .filter((id): id is ID => id !== undefined);
  const receptenRuw = await haalOp(payload, 'recepten', receptIds);

  const ingrediëntIds = [
    ...new Set(
      receptenRuw.flatMap((recept: RuwRecord) =>
        ((recept.ingredienten ?? []) as RuwRecord[])
          .map((regel: RuwRecord) => idVan(regel.ingredient as never))
          .filter((id: ID | undefined): id is ID => id !== undefined),
      ),
    ),
  ];
  const ingredientenRuw = await haalOp(payload, 'ingredienten', ingrediëntIds);

  const evenement = mapEvenement(evenementRuw);
  const producten = indexeer(productenRuw.map(mapProduct));
  const recepten = indexeer(receptenRuw.map(mapRecept));
  const ingredienten = indexeer(ingredientenRuw.map(mapIngredient));
  const allergenen = indexeer(allergenenRuw.docs.map(mapAllergeen));
  const btwTarieven = indexeer(btwRuw.docs.map(mapBtwTarief));
  const materialen = indexeer(materialenRuw.map(mapMateriaal));
  const leveranciers = indexeer(leveranciersRuw.docs.map(mapLeverancier));

  const bedrijf = (await payload.findGlobal({
    slug: 'bedrijfsinstellingen',
    depth: 0,
    overrideAccess: true,
  })) as unknown as BedrijfsinstellingenRuw;

  return {
    dataset: {
      evenement,
      producten,
      recepten,
      ingredienten,
      allergenen,
      btwTarieven,
      materialen,
      leveranciers,
      klanten: indexeer([
        {
          id: alsId(klantRuw.id),
          naam: klantRuw.naam,
          contactpersoon: klantRuw.contactpersoon ?? undefined,
          email: klantRuw.email ?? undefined,
          telefoon: klantRuw.telefoon ?? undefined,
          btwNummer: klantRuw.btwNummer ?? undefined,
          notities: klantRuw.notities ?? undefined,
          adres: mapAdres(klantRuw.adres),
          factuuradres: mapAdres(klantRuw.factuuradres),
        },
      ]),
    },
    klant: mapKlant(klantRuw),
    bedrijf,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Van Payload-record naar het type waar de rekenmotor mee werkt
// ─────────────────────────────────────────────────────────────────────────────

function mapAdres(adres: any) {
  if (adres === null || adres === undefined || adres.straat === null) return undefined;
  return {
    straat: adres.straat ?? '',
    huisnummer: adres.huisnummer ?? '',
    postcode: adres.postcode ?? '',
    plaats: adres.plaats ?? '',
    land: adres.land ?? 'Nederland',
  };
}

function mapKlant(klant: any): Klant {
  return {
    id: alsId(klant.id),
    naam: klant.naam,
    contactpersoon: klant.contactpersoon ?? undefined,
    email: klant.email ?? undefined,
    telefoon: klant.telefoon ?? undefined,
    btwNummer: klant.btwNummer ?? undefined,
    notities: klant.notities ?? undefined,
    adres: mapAdres(klant.adres),
    factuuradres: mapAdres(klant.factuuradres),
  };
}

function mapEvenement(ruw: any): Evenement {
  return {
    id: alsId(ruw.id),
    klant: alsId(idVan(ruw.klant) ?? ''),
    titel: ruw.titel,
    datum: String(ruw.datum).slice(0, 10),
    locatie: ruw.locatie ?? undefined,
    aantalGasten: ruw.aantalGasten,
    status: ruw.status,
    notities: ruw.notities ?? undefined,
    producten: (ruw.producten ?? []).map((regel: any) => ({
      product: alsId(idVan(regel.product) ?? ''),
      ...(regel.aantalGastenOverride !== null && regel.aantalGastenOverride !== undefined
        ? { aantalGastenOverride: regel.aantalGastenOverride }
        : {}),
      ...(regel.hoeveelheidPerPersoonOverride !== null &&
      regel.hoeveelheidPerPersoonOverride !== undefined
        ? { hoeveelheidPerPersoonOverride: regel.hoeveelheidPerPersoonOverride }
        : {}),
    })),
    materialen: (ruw.materialen ?? []).map((regel: any) => ({
      materiaal: alsId(idVan(regel.materiaal) ?? ''),
      aantal: regel.aantal,
    })),
  };
}

function mapProduct(ruw: any): Product {
  return {
    id: alsId(ruw.id),
    naam: ruw.naam,
    categorie: alsId(idVan(ruw.categorie) ?? ''),
    fotos: idsVan(ruw.fotos),
    ...(idVan(ruw.hoofdfoto) !== undefined ? { hoofdfoto: idVan(ruw.hoofdfoto) } : {}),
    portiesBasis: ruw.portiesBasis,
    eenheid: ruw.eenheid,
    hoeveelheidPerPersoon: ruw.hoeveelheidPerPersoon,
    ...(idVan(ruw.recept) !== undefined ? { recept: idVan(ruw.recept) } : {}),
    prijsPerPersoon: ruw.prijsPerPersoon,
    btwTarief: alsId(idVan(ruw.btwTarief) ?? ''),
    allergenen: idsVan(ruw.allergenen),
    // B14 — materiaalregels per gast. Zonder deze regel zou de motor ze nooit zien en zou
    // elk materiaal als "handmatig" op de lijst komen.
    materialen: ((ruw.materialen ?? []) as RuwRecord[]).map((regel: RuwRecord) => ({
      materiaal: alsId(idVan(regel.materiaal as never) ?? ''),
      hoeveelheid: Number(regel.hoeveelheid ?? 0),
      perAantalGasten: Number(regel.perAantalGasten ?? 1),
    })),
    actief: Boolean(ruw.actief),
  };
}

function mapRecept(ruw: any): Recept {
  return {
    id: alsId(ruw.id),
    naam: ruw.naam,
    basisPorties: ruw.basisPorties,
    hoeveelheidPerPersoon: ruw.hoeveelheidPerPersoon,
    eenheid: ruw.eenheid,
    bereidingswijze: ruw.bereidingswijze ?? undefined,
    ...(ruw.kooktijdMinuten !== null && ruw.kooktijdMinuten !== undefined
      ? { kooktijdMinuten: ruw.kooktijdMinuten }
      : {}),
    ...(ruw.keukenstation !== null && ruw.keukenstation !== undefined
      ? { keukenstation: ruw.keukenstation }
      : {}),
    ingredienten: (ruw.ingredienten ?? []).map((regel: any) => ({
      ingredient: alsId(idVan(regel.ingredient) ?? ''),
      hoeveelheid: regel.hoeveelheid,
      eenheid: regel.eenheid,
    })),
  };
}

function mapIngredient(ruw: any): Ingredient {
  return {
    id: alsId(ruw.id),
    naam: ruw.naam,
    inkoopeenheid: ruw.inkoopeenheid,
    inkoopprijs: ruw.inkoopprijs,
    ...(idVan(ruw.leverancier) !== undefined ? { leverancier: idVan(ruw.leverancier) } : {}),
    allergenen: idsVan(ruw.allergenen),
    ...(ruw.houdbaarheidDagen !== null && ruw.houdbaarheidDagen !== undefined
      ? { houdbaarheidDagen: ruw.houdbaarheidDagen }
      : {}),
    ...(ruw.voorraad !== null && ruw.voorraad !== undefined ? { voorraad: ruw.voorraad } : {}),
  };
}

function mapAllergeen(ruw: any): Allergeen {
  return {
    id: alsId(ruw.id),
    naam: ruw.naam,
    wettelijkeCode: ruw.wettelijkeCode,
    ...(idVan(ruw.icoon) !== undefined ? { icoon: idVan(ruw.icoon) } : {}),
  };
}

function mapBtwTarief(ruw: any): BtwTarief {
  return {
    id: alsId(ruw.id),
    naam: ruw.naam,
    percentage: ruw.percentage,
    standaard: Boolean(ruw.standaard),
  };
}

function mapMateriaal(ruw: any): Materiaal {
  return {
    id: alsId(ruw.id),
    naam: ruw.naam,
    eenheid: ruw.eenheid,
    voorraadBeheerd: Boolean(ruw.voorraadBeheerd),
    ...(ruw.voorraad !== null && ruw.voorraad !== undefined ? { voorraad: ruw.voorraad } : {}),
    ...(ruw.huurprijs !== null && ruw.huurprijs !== undefined ? { huurprijs: ruw.huurprijs } : {}),
    ...(ruw.kostprijs !== null && ruw.kostprijs !== undefined ? { kostprijs: ruw.kostprijs } : {}),
  };
}

function mapLeverancier(ruw: any): Leverancier {
  return {
    id: alsId(ruw.id),
    naam: ruw.naam,
    ...(ruw.contactpersoon ? { contactpersoon: ruw.contactpersoon } : {}),
    ...(ruw.email ? { email: ruw.email } : {}),
    ...(ruw.telefoon ? { telefoon: ruw.telefoon } : {}),
  };
}

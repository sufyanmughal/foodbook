import type {
  AfvinkStatus,
  Eenheid,
  EventStatus,
  FactuurStatus,
  ID,
  LeveringStatus,
  MediaVariant,
  OfferteStatus,
  OrderStatus,
  Rol,
} from './enums';

/** Herbruikbaar adres (§3.6, §3.15). */
export interface Adres {
  straat: string;
  huisnummer: string;
  postcode: string;
  plaats: string;
  land: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// §3.4 Allergeen
// ─────────────────────────────────────────────────────────────────────────────

export interface Allergeen {
  id: ID;
  naam: string;
  wettelijkeCode: string;
  icoon?: ID;
}

// ─────────────────────────────────────────────────────────────────────────────
// §3.5 BTW-tarief
// ─────────────────────────────────────────────────────────────────────────────

export interface BtwTarief {
  id: ID;
  naam: string;
  /** Percentage, bv. 9 of 21 (niet 0.09). */
  percentage: number;
  standaard: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// §3.3 Leverancier + Ingrediënt
// ─────────────────────────────────────────────────────────────────────────────

export interface Leverancier {
  id: ID;
  naam: string;
  contactpersoon?: string;
  email?: string;
  telefoon?: string;
}

export interface Ingredient {
  id: ID;
  naam: string;
  inkoopeenheid: Eenheid;
  /** Prijs per één inkoopeenheid. */
  inkoopprijs: number;
  leverancier?: ID;
  allergenen: ID[];
  houdbaarheidDagen?: number;
  /** Eenvoudige voorraadadministratie (v1: alleen dit getal, in inkoopeenheid). */
  voorraad?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// §3.2 Recept + receptregel
// ─────────────────────────────────────────────────────────────────────────────

export interface ReceptRegel {
  ingredient: ID;
  hoeveelheid: number;
  eenheid: Eenheid;
}

export interface Recept {
  id: ID;
  naam: string;
  /** Aantal porties waarvoor dit recept geschreven is. */
  basisPorties: number;
  /**
   * Standaard portiegrootte waarop de receptregels zijn gebaseerd, uitgedrukt in `eenheid`.
   *
   * Dit is de normalisatieconstante uit ARCHITECTURE.md §4.1: de rekenmotor vergelijkt de
   * effectieve `Product.hoeveelheidPerPersoon` hiermee, zodat een wijziging van 180g naar 160g
   * op productniveau de ingredienthoeveelheden proportioneel laat meeschalen.
   */
  hoeveelheidPerPersoon: number;
  /** Eenheid van `hoeveelheidPerPersoon`; moet dezelfde dimensie hebben als het product. */
  eenheid: Eenheid;
  ingredienten: ReceptRegel[];
  bereidingswijze?: string;
  kooktijdMinuten?: number;
  /** Optioneel: keukenstation voor groepering op de productielijst (§5). */
  keukenstation?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// §3.1 Product + categorie + seizoen
// ─────────────────────────────────────────────────────────────────────────────

export interface Categorie {
  id: ID;
  naam: string;
  volgorde?: number;
}

export interface Seizoen {
  id: ID;
  naam: string;
}

/**
 * §3.8/B14 — materiaal dat bij dit product hoort, gerekend naar het aantal gasten.
 *
 * `hoeveelheid` per `perAantalGasten` gasten: één bord per gast is `1 per 1`, één warmhoudplaat
 * per 50 gasten is `1 per 50`. De rekenmotor rondt naar boven af op hele stuks — een halve
 * warmhoudplaat bestaat niet.
 */
export interface ProductMateriaalRegel {
  materiaal: ID;
  hoeveelheid: number;
  perAantalGasten: number;
}

export interface Product {
  id: ID;
  naam: string;
  beschrijving?: string;
  categorie: ID;
  fotos: ID[];
  hoofdfoto?: ID;
  /** Basis waarop dit product is gekost (meestal 1). */
  portiesBasis: number;
  eenheid: Eenheid;
  /** §4.1 — het veld dat de rekenmotor schaalt. Hoeveelheid product per persoon. */
  hoeveelheidPerPersoon: number;
  recept?: ID;
  /** Excl. btw. */
  prijsPerPersoon: number;
  btwTarief: ID;
  /** Directe allergenen-tags; wordt geüniet met de allergenen uit het recept (§4.3). */
  allergenen: ID[];
  /**
   * Materialen die standaard bij dit product horen, per aantal gasten (B14).
   * Naast deze automatische berekening kan per evenement handmatig worden bijgesteld.
   */
  materialen?: ProductMateriaalRegel[];
  actief: boolean;
  seizoen?: ID;
}

// ─────────────────────────────────────────────────────────────────────────────
// §3.6 Klant
// ─────────────────────────────────────────────────────────────────────────────

export interface Klant {
  id: ID;
  naam: string;
  contactpersoon?: string;
  email?: string;
  telefoon?: string;
  adres?: Adres;
  factuuradres?: Adres;
  btwNummer?: string;
  notities?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// §3.7 Evenement + regels
// ─────────────────────────────────────────────────────────────────────────────

export interface EventRegel {
  product: ID;
  /** Optioneel: dit gerecht is voor een subset van de gasten. */
  aantalGastenOverride?: number;
  /** Optioneel: dit evenement rekent met een andere hoeveelheid per persoon. */
  hoeveelheidPerPersoonOverride?: number;
}

export interface EventMateriaalRegel {
  materiaal: ID;
  aantal: number;
}

export interface Evenement {
  id: ID;
  klant: ID;
  titel: string;
  datum: string;
  locatie?: string;
  /** Het ene getal dat alle herberekening aandrijft (§3.7). */
  aantalGasten: number;
  status: EventStatus;
  producten: EventRegel[];
  materialen: EventMateriaalRegel[];
  notities?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// §3.8 Materiaal
// ─────────────────────────────────────────────────────────────────────────────

export interface Materiaal {
  id: ID;
  naam: string;
  eenheid: Eenheid;
  voorraadBeheerd: boolean;
  /** Voorraad in `eenheid` (alleen relevant als voorraadBeheerd). */
  voorraad?: number;
  huurprijs?: number;
  kostprijs?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// §3.9 Media
// ─────────────────────────────────────────────────────────────────────────────

export interface MediaVariantBestand {
  variant: MediaVariant;
  bestandsnaam: string;
  breedte: number;
  hoogte: number;
}

export interface Media {
  id: ID;
  bestand: string;
  varianten: MediaVariantBestand[];
  volgorde: number;
  altTekst: string;
  gekoppeldAan?: ID;
}

// ─────────────────────────────────────────────────────────────────────────────
// §3.10 Offerte
// ─────────────────────────────────────────────────────────────────────────────

/** Bevroren regel op het moment van genereren — verandert nooit meer mee met het product. */
export interface OfferteRegel {
  product: ID;
  productNaam: string;
  aantalGasten: number;
  hoeveelheidPerPersoon: number;
  eenheid: Eenheid;
  prijsPerPersoon: number;
  btwTarief: ID;
  btwPercentage: number;
  regelTotaalExcl: number;
  btwBedrag: number;
  regelTotaalIncl: number;
}

export interface BtwUitsplitsing {
  btwTarief: ID;
  naam: string;
  percentage: number;
  grondslag: number;
  btwBedrag: number;
}

export interface Offerte {
  id: ID;
  event: ID;
  versie: number;
  regels: OfferteRegel[];
  btwUitsplitsing: BtwUitsplitsing[];
  subtotaal: number;
  btwTotaal: number;
  totaal: number;
  status: OfferteStatus;
  geldigTot: string;
  notities?: string;
  pdfBestand?: ID;
}

// ─────────────────────────────────────────────────────────────────────────────
// §3.11 Order
// ─────────────────────────────────────────────────────────────────────────────

export interface Order {
  id: ID;
  event: ID;
  /** De geaccepteerde offerteversie. */
  offerte: ID;
  status: OrderStatus;
  bevestigingsdatum: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// §3.12 Productie
// ─────────────────────────────────────────────────────────────────────────────

export interface ProductieIngredientRegel {
  ingredient: ID;
  naam: string;
  /** Exacte hoeveelheid in de basis-eenheid van de dimensie (gram / ml / stuk). */
  hoeveelheid: number;
  basisEenheid: Eenheid;
  /** Kostprijs van deze exacte hoeveelheid, uit `Ingredient.inkoopprijs`. */
  kostprijs: number;
}

export interface ProductieReceptRegel {
  product: ID;
  productNaam: string;
  recept?: ID;
  receptNaam?: string;
  keukenstation?: string;
  aantalGasten: number;
  hoeveelheidPerPersoon: number;
  eenheid: Eenheid;
  /** Totale producthoeveelheid voor dit evenement (hpp × gasten), in `eenheid`. */
  productHoeveelheid: number;
  ingredienten: ProductieIngredientRegel[];
  /** Totale kostprijs van alle ingrediënten van deze regel. */
  kostprijs: number;
}

export interface Productie {
  order: ID;
  regels: ProductieReceptRegel[];
  keukenlijstNotities?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// §3.13 Inkoop
// ─────────────────────────────────────────────────────────────────────────────

export interface InkoopRegel {
  ingredient: ID;
  naam: string;
  hoeveelheid: number;
  inkoopEenheid: Eenheid;
  eenheidsprijs: number;
  kostprijs: number;
  leverancier?: ID;
  leverancierNaam?: string;
  /** Bij welke evenementen deze behoefte hoort (audit trail). */
  herkomst: ID[];
}

export interface Inkoop {
  periodeVan: string;
  periodeTot: string;
  regels: InkoopRegel[];
}

// ─────────────────────────────────────────────────────────────────────────────
// §3.14 Picking
// ─────────────────────────────────────────────────────────────────────────────

export interface PaklijstRegel {
  soort: 'voedsel' | 'materiaal';
  referentie: ID;
  omschrijving: string;
  hoeveelheid: number;
  eenheid: Eenheid;
  afgevinkt: boolean;
}

/**
 * B14 — materiaalbehoefte van een evenement.
 *
 * `automatisch` komt uit de materiaalregels op de producten, `handmatig` uit wat er per evenement
 * is toegevoegd. Beide kunnen naast elkaar bestaan: een bord per gast uit het product, plus tien
 * extra borden die ter plekke nodig blijken.
 */
export interface MateriaalBehoefte {
  materiaal: ID;
  naam: string;
  eenheid: Eenheid;
  /** Uit de materiaalregels van de gekozen producten. */
  automatisch: number;
  /** Handmatig toegevoegd of bijgesteld op het evenement zelf. */
  handmatig: number;
  /** Het totaal dat mee moet. */
  totaal: number;
  /** Welke producten om dit materiaal vroegen, voor de onderbouwing. */
  herkomst: string[];
}

export interface Picking {
  order: ID;
  regels: PaklijstRegel[];
  afgevinktDoor?: ID;
  afgevinktOp?: string;
  status: AfvinkStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// §3.15 Levering
// ─────────────────────────────────────────────────────────────────────────────

export interface Levering {
  id: ID;
  order: ID;
  leverdatum: string;
  levertijd: string;
  adres?: Adres;
  verantwoordelijke?: string;
  status: LeveringStatus;
}

// ─────────────────────────────────────────────────────────────────────────────
// §3.16 Factuur
// ─────────────────────────────────────────────────────────────────────────────

export interface FactuurRegel {
  omschrijving: string;
  aantal: number;
  eenheidsprijs: number;
  btwTarief: ID;
  btwPercentage: number;
  regelTotaalExcl: number;
  btwBedrag: number;
  regelTotaalIncl: number;
}

export interface Factuur {
  id: ID;
  order: ID;
  /** Gapless en oplopend — wettelijk verplicht, nooit hergebruikt of verwijderd. */
  factuurnummer: string;
  factuurdatum: string;
  vervaldatum: string;
  regels: FactuurRegel[];
  btwUitsplitsing: BtwUitsplitsing[];
  subtotaal: number;
  btwTotaal: number;
  totaal: number;
  status: FactuurStatus;
  pdfBestand?: ID;
  /** Gezet wanneer deze factuur een eerdere factuur crediteert. */
  creditVan?: ID;
}

// ─────────────────────────────────────────────────────────────────────────────
// §3.17 Gebruiker & bedrijfsinstellingen
// ─────────────────────────────────────────────────────────────────────────────

export interface Gebruiker {
  id: ID;
  email: string;
  naam: string;
  rol: Rol;
}

export interface Bedrijfsinstellingen {
  naam: string;
  logo?: ID;
  kvkNummer: string;
  btwNummer: string;
  iban: string;
  adres?: Adres;
  email: string;
  telefoon?: string;
  primaireKleur: string;
  secundaireKleur: string;
  standaardVoettekst: string;
  /** Betalingstermijn in dagen — bepaalt vervaldatum van facturen. */
  betalingstermijnDagen: number;
  /** Geldigheid van een offerte in dagen. */
  offerteGeldigheidDagen: number;
  /** Prefix en jaarformaat van het factuurnummer, bv. "F". */
  factuurPrefix: string;
}

/** Verzendlog per document (§5) — wie stuurde welk document wanneer naar wie. */
export interface Verzendlog {
  id: ID;
  event: ID;
  documentType: string;
  ontvanger: string;
  onderwerp: string;
  verzondenOp: string;
  verzondenDoor: ID;
}

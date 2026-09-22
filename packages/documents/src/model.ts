import type { Adres, Bedrijfsinstellingen, Klant } from '@foodbook/shared-types';
import { t } from '@foodbook/i18n';

/**
 * Alle documenttypes uit ARCHITECTURE.md §5.
 *
 * §5 noemt inkooplijst en materialenlijst in één rij. De klant heeft ze in v1 bewust gesplitst:
 * voedsel loopt via recepten naar productie en inkoop, materialen via een eigen berekening naar
 * een eigen lijst. Het zijn twee processen en dus twee documenten, wat het aantal op tien brengt.
 *
 * Eén gedeeld model voor elk document, zodat "bekijken / printen / PDF / e-mailen" één keer
 * gebouwd wordt en door elk sjabloon hergebruikt wordt.
 */
export const DOCUMENT_TYPES = [
  'offerte',
  'orderbevestiging',
  'productielijst',
  'keukenlijst',
  'inkooplijst',
  'materialenlijst',
  'paklijst',
  'leveringslijst',
  'allergenenlijst',
  'factuur',
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/** Fout bij het opbouwen van een document, bv. omdat de brondata ontbreekt. */
export class DocumentFout extends Error {
  override readonly name = 'DocumentFout';
}

export interface DocumentRij {
  cellen: string[];
  /** Visueel benadrukken, bv. een subtotaalregel. */
  nadruk?: boolean;
  /** Op papier af te vinken (paklijst). */
  afvinkbaar?: boolean;
}

export interface DocumentSectie {
  titel?: string;
  kolommen: string[];
  rijen: DocumentRij[];
  /** Relatieve kolombreedtes; het PDF-sjabloon gebruikt dit voor de tabelverdeling. */
  breedtes?: number[];
  /**
   * Een matrix: alle kolommen na de eerste bevatten geen getallen maar een teken (X of leeg), en
   * horen dus gecentreerd in plaats van rechts uitgelijnd.
   */
  matrix?: boolean;
}

export interface DocumentBlok {
  titel: string;
  regels: string[];
}

export interface DocumentMetaRegel {
  label: string;
  waarde: string;
  nadruk?: boolean;
}

export interface DocumentModel {
  type: DocumentType;
  titel: string;
  ondertitel?: string;
  /** Kenmerkende regels rechtsboven, bv. Factuurnummer en Factuurdatum. */
  meta: DocumentMetaRegel[];
  /** Adres- en gegevensblokken. */
  blokken: DocumentBlok[];
  secties: DocumentSectie[];
  totalen: DocumentMetaRegel[];
  voettekst: string;
  /** Voorgestelde bestandsnaam zonder extensie, bv. `Offerte_Bruiloft-Jansen_2026-06-01`. */
  bestandsnaam: string;
}

export function adresRegels(adres: Adres | undefined): string[] {
  if (adres === undefined) return [];
  return [
    adres.straat ? `${adres.straat} ${adres.huisnummer}`.trim() : adres.huisnummer,
    `${adres.postcode} ${adres.plaats}`.trim(),
    adres.land,
  ].filter((regel) => regel.length > 0);
}

/** Laat lege regels weg. Een leeg bedrijfsgegeven mag nooit een document laten mislukken. */
function nietLeeg(regels: (string | undefined | null)[]): string[] {
  return regels.filter((regel): regel is string => typeof regel === 'string' && regel.length > 0);
}

export function bedrijfsBlok(bedrijf: Bedrijfsinstellingen): DocumentBlok {
  return {
    titel: t('documentKoppen.bedrijfsgegevens'),
    regels: nietLeeg([
      bedrijf.naam,
      ...adresRegels(bedrijf.adres),
      bedrijf.kvkNummer !== undefined ? `KVK ${bedrijf.kvkNummer}` : undefined,
      bedrijf.btwNummer !== undefined ? `BTW ${bedrijf.btwNummer}` : undefined,
      bedrijf.telefoon,
      bedrijf.email,
    ]),
  };
}

export function klantBlok(klant: Klant, titel = t('documentKoppen.klantgegevens')): DocumentBlok {
  const naam = klant.contactpersoon ? `${klant.naam} t.a.v. ${klant.contactpersoon}` : klant.naam;
  return {
    titel,
    regels: nietLeeg([
      naam,
      ...adresRegels(klant.factuuradres ?? klant.adres),
      klant.email,
      klant.telefoon,
      klant.btwNummer !== undefined ? `BTW ${klant.btwNummer}` : undefined,
    ]),
  };
}

/**
 * Maakt een bestandsnaam die in Windows-bestandsverkenner en in een e-mailbijlage werkt:
 * geen spaties, geen aanhalingstekens, geen dubbele punten.
 */
export function maakBestandsnaam(onderdelen: (string | undefined)[]): string {
  return onderdelen
    .filter((onderdeel): onderdeel is string => onderdeel !== undefined && onderdeel.length > 0)
    .map((onderdeel) =>
      onderdeel
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9-_]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, ''),
    )
    .join('_');
}

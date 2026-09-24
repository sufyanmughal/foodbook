import type { Field, Option } from 'payload';
import type { Eenheid } from '@foodbook/shared-types';
import { EENHEDEN } from '@foodbook/shared-types';
import { en } from '@foodbook/i18n';

/** Zet Nederlandse labels om naar Payload-selectopties. */
export function opties<T extends string>(waarden: readonly T[], labels: Record<T, string>): Option[] {
  return waarden.map((waarde) => ({ label: labels[waarde], value: waarde }));
}

/** De vijf eenheden uit §3.1/§3.3, met hun Nederlandse labels. */
export const eenheidOpties = (): Option[] => opties<Eenheid>(EENHEDEN, en.eenheden);

/** Herbruikbaar adresblok (§3.6, §3.15). */
export function adresVeld(naam: string, label: string): Field {
  return {
    name: naam,
    type: 'group',
    label,
    fields: [
      { name: 'straat', type: 'text', label: 'Straat' },
      { name: 'huisnummer', type: 'text', label: 'Huisnummer' },
      { name: 'postcode', type: 'text', label: 'Postcode' },
      { name: 'plaats', type: 'text', label: 'Plaats' },
      { name: 'land', type: 'text', label: 'Land', defaultValue: 'Nederland' },
    ],
  };
}

/** Statusselect met de Nederlandse labels uit de i18n-laag. */
export function statusVeld(
  naam: string,
  waarden: readonly string[],
  labels: Record<string, string>,
  standaard: string,
): Field {
  return {
    name: naam,
    type: 'select',
    required: true,
    defaultValue: standaard,
    options: opties(waarden, labels),
    label: en.velden.status,
    index: true,
  };
}

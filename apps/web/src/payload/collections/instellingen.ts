import type { CollectionConfig, GlobalConfig } from 'payload';
import type { Rol } from '@foodbook/shared-types';
import { ROLLEN } from '@foodbook/shared-types';
import { DOCUMENT_TYPES } from '@foodbook/documents';
import { nl } from '@foodbook/i18n';
import { heeftRol, isBeheerder, isIngelogd } from '../access/rollen';
import { adresVeld, opties } from '../velden';

// ─────────────────────────────────────────────────────────────────────────────
// §3.17 Gebruikers & rollen
// ─────────────────────────────────────────────────────────────────────────────

export const Gebruikers: CollectionConfig = {
  slug: 'gebruikers',
  labels: { singular: 'Gebruiker', plural: 'Gebruikers' },
  auth: true,
  admin: {
    useAsTitle: 'email',
    group: 'Instellingen',
    defaultColumns: ['naam', 'email', 'rol'],
    description: 'Alleen de beheerder beheert gebruikers en rollen.',
  },
  access: {
    read: isIngelogd,
    create: isBeheerder,
    update: isBeheerder,
    delete: isBeheerder,
    admin: ({ req }) => Boolean(req.user),
  },
  fields: [
    { name: 'naam', type: 'text', required: true, label: 'Naam' },
    {
      name: 'rol',
      type: 'select',
      required: true,
      defaultValue: 'verkoop',
      options: opties<Rol>(ROLLEN, nl.rollen),
      label: 'Rol',
      saveToJWT: true,
      admin: { description: 'Bepaalt welke onderdelen deze gebruiker mag zien en bewerken.' },
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Bedrijfsinstellingen — één record, dus een Global in plaats van een collectie
// ─────────────────────────────────────────────────────────────────────────────

export const Bedrijfsinstellingen: GlobalConfig = {
  slug: 'bedrijfsinstellingen',
  label: 'Bedrijfsinstellingen',
  admin: {
    group: 'Instellingen',
    description:
      'Logo, kleuren en juridische gegevens die op elk document terechtkomen. Door de beheerder zelf aan te passen.',
  },
  access: {
    read: isIngelogd,
    update: heeftRol('beheerder'),
  },
  fields: [
    { name: 'naam', type: 'text', required: true, label: 'Bedrijfsnaam' },
    { name: 'logo', type: 'upload', relationTo: 'media', label: 'Logo' },
    { name: 'kvkNummer', type: 'text', required: true, label: 'KVK-nummer' },
    { name: 'btwNummer', type: 'text', required: true, label: 'Btw-nummer' },
    { name: 'iban', type: 'text', required: true, label: 'IBAN' },
    adresVeld('adres', 'Adres'),
    { name: 'email', type: 'email', required: true, label: 'E-mailadres' },
    { name: 'telefoon', type: 'text', label: 'Telefoon' },
    {
      name: 'primaireKleur',
      type: 'text',
      required: true,
      defaultValue: '#1f3d34',
      label: 'Primaire kleur',
      admin: { description: 'Hexkleur, bv. #1f3d34. Komt op de koppen van documenten.' },
    },
    {
      name: 'secundaireKleur',
      type: 'text',
      required: true,
      defaultValue: '#c99a3f',
      label: 'Secundaire kleur',
    },
    { name: 'standaardVoettekst', type: 'textarea', required: true, label: 'Standaard voettekst' },
    {
      name: 'betalingstermijnDagen',
      type: 'number',
      required: true,
      defaultValue: 30,
      min: 0,
      label: 'Betalingstermijn (dagen)',
      admin: { description: 'Bepaalt de vervaldatum van een factuur.' },
    },
    {
      name: 'offerteGeldigheidDagen',
      type: 'number',
      required: true,
      defaultValue: 30,
      min: 1,
      label: 'Offerte geldig (dagen)',
    },
    {
      name: 'factuurPrefix',
      type: 'text',
      required: true,
      defaultValue: 'F',
      label: 'Prefix factuurnummer',
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Verzendlog (§5) — wie stuurde welk document wanneer naar welke klant
// ─────────────────────────────────────────────────────────────────────────────

export const Verzendlog: CollectionConfig = {
  slug: 'verzendlog',
  labels: { singular: 'Verzendlogregel', plural: 'Verzendlog' },
  admin: {
    useAsTitle: 'onderwerp',
    group: 'Instellingen',
    defaultColumns: ['verzondenOp', 'documentType', 'ontvanger', 'verzondenDoor'],
    description: 'Audit trail van alle per e-mail verzonden documenten.',
  },
  access: {
    read: isIngelogd,
    create: heeftRol('beheerder', 'verkoop', 'logistiek', 'keuken'),
    update: isBeheerder,
    delete: isBeheerder,
  },
  fields: [
    { name: 'event', type: 'relationship', relationTo: 'evenementen', required: true, label: 'Evenement' },
    {
      name: 'documentType',
      type: 'select',
      required: true,
      options: opties(DOCUMENT_TYPES, nl.documenten),
      label: 'Documenttype',
    },
    { name: 'ontvanger', type: 'email', required: true, label: 'Ontvanger' },
    { name: 'onderwerp', type: 'text', required: true, label: 'Onderwerp' },
    { name: 'verzondenOp', type: 'date', required: true, label: 'Verzonden op' },
    { name: 'verzondenDoor', type: 'relationship', relationTo: 'gebruikers', required: true, label: 'Verzonden door' },
  ],
};

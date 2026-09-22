import type { CollectionConfig } from 'payload';
import { EVENT_STATUS } from '@foodbook/shared-types';
import { nl } from '@foodbook/i18n';
import { logistiekToegang, verkoopToegang } from '../access/rollen';
import { adresVeld, eenheidOpties, statusVeld } from '../velden';

// ─────────────────────────────────────────────────────────────────────────────
// §3.6 Klanten
// ─────────────────────────────────────────────────────────────────────────────

export const Klanten: CollectionConfig = {
  slug: 'klanten',
  labels: { singular: 'Klant', plural: 'Klanten' },
  admin: {
    useAsTitle: 'naam',
    group: 'Klanten & evenementen',
    defaultColumns: ['naam', 'contactpersoon', 'email', 'telefoon'],
    description: 'Zoek op naam of e-mail; de klanthistorie staat op de evenementen van deze klant.',
  },
  access: verkoopToegang,
  fields: [
    { name: 'naam', type: 'text', required: true, index: true, label: 'Naam' },
    { name: 'contactpersoon', type: 'text', label: 'Contactpersoon' },
    { name: 'email', type: 'email', label: 'E-mailadres' },
    { name: 'telefoon', type: 'text', label: 'Telefoon' },
    adresVeld('adres', 'Adres'),
    adresVeld('factuuradres', 'Factuuradres'),
    { name: 'btwNummer', type: 'text', label: 'Btw-nummer' },
    {
      name: 'notities',
      type: 'textarea',
      label: 'Notities',
      admin: { description: 'Interne notities, bv. dieetwensen uit eerdere evenementen.' },
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// §3.8 Materialen
// ─────────────────────────────────────────────────────────────────────────────

export const Materialen: CollectionConfig = {
  slug: 'materialen',
  labels: { singular: 'Materiaal', plural: 'Materialen' },
  admin: {
    useAsTitle: 'naam',
    group: 'Klanten & evenementen',
    defaultColumns: ['naam', 'eenheid', 'voorraadBeheerd', 'huurprijs'],
    description: 'Niet-voedsel: borden, bestek, linnen, chafing dishes, transportkratten.',
  },
  access: logistiekToegang,
  fields: [
    { name: 'naam', type: 'text', required: true, label: 'Naam' },
    { name: 'eenheid', type: 'select', required: true, options: eenheidOpties(), label: 'Eenheid' },
    {
      name: 'voorraadBeheerd',
      type: 'checkbox',
      defaultValue: false,
      label: 'Voorraad beheerd',
      admin: { description: 'v1: alleen deze vlag; volledig voorraadbeheer is fase 2.' },
    },
    {
      name: 'voorraad',
      type: 'number',
      min: 0,
      label: 'Voorraad',
      admin: { condition: (data) => Boolean(data?.voorraadBeheerd) },
    },
    { name: 'huurprijs', type: 'number', min: 0, label: 'Huurprijs' },
    { name: 'kostprijs', type: 'number', min: 0, label: 'Kostprijs' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// §3.7 Evenementen — het centrale planningsobject
// ─────────────────────────────────────────────────────────────────────────────

export const Evenementen: CollectionConfig = {
  slug: 'evenementen',
  labels: { singular: 'Evenement', plural: 'Evenementen' },
  admin: {
    useAsTitle: 'titel',
    group: 'Klanten & evenementen',
    defaultColumns: ['titel', 'klant', 'datum', 'aantalGasten', 'status'],
    description:
      'Het aantal gasten drijft alle herberekening aan. Een wijziging werkt direct door in productie, inkoop en picking.',
  },
  access: verkoopToegang,
  fields: [
    { name: 'klant', type: 'relationship', relationTo: 'klanten', required: true, label: 'Klant' },
    { name: 'titel', type: 'text', required: true, label: 'Titel' },
    { name: 'datum', type: 'date', required: true, index: true, label: 'Datum' },
    { name: 'locatie', type: 'textarea', label: 'Locatie' },
    {
      name: 'aantalGasten',
      type: 'number',
      required: true,
      min: 0,
      label: 'Aantal gasten',
      admin: { description: 'Het ene getal dat de hele keten herberekent.' },
    },
    statusVeld('status', EVENT_STATUS, nl.status.evenement, 'concept'),
    {
      name: 'producten',
      type: 'array',
      label: 'Producten',
      labels: { singular: 'Productregel', plural: 'Producten' },
      admin: { description: 'Laat de overrides leeg om de productstandaard te gebruiken.' },
      fields: [
        { name: 'product', type: 'relationship', relationTo: 'producten', required: true, label: 'Product' },
        {
          name: 'aantalGastenOverride',
          type: 'number',
          min: 0,
          label: 'Aantal gasten (afwijkend)',
          admin: { description: 'Alleen als dit gerecht voor een deel van de gasten is.' },
        },
        {
          name: 'hoeveelheidPerPersoonOverride',
          type: 'number',
          min: 0.001,
          label: 'Hoeveelheid per persoon (afwijkend)',
          admin: { description: 'Alleen als dit evenement een andere portie nodig heeft.' },
        },
      ],
    },
    {
      name: 'materialen',
      type: 'array',
      label: 'Materialen',
      labels: { singular: 'Materiaalregel', plural: 'Materialen' },
      fields: [
        { name: 'materiaal', type: 'relationship', relationTo: 'materialen', required: true, label: 'Materiaal' },
        { name: 'aantal', type: 'number', required: true, min: 0, label: 'Aantal' },
      ],
    },
    { name: 'notities', type: 'textarea', label: 'Notities' },
  ],
};

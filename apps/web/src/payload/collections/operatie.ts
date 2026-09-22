import type { CollectionConfig, Field } from 'payload';
import { LEVERING_STATUS } from '@foodbook/shared-types';
import { nl } from '@foodbook/i18n';
import { logistiekToegang } from '../access/rollen';
import { adresVeld, statusVeld } from '../velden';

const GROEP = 'Operatie';

/** Regels die de rekenmotor heeft berekend: alleen-lezen, nooit met de hand ingevuld. */
const berekendeRegels = (velden: Field[]): Field => ({
  name: 'regels',
  type: 'array',
  label: 'Regels',
  admin: {
    readOnly: true,
    description: 'Automatisch berekend door de rekenmotor — niet handmatig aan te passen.',
  },
  fields: velden,
});

// ─────────────────────────────────────────────────────────────────────────────
// §3.12 Productie — afgeleid, niet ingevoerd
// ─────────────────────────────────────────────────────────────────────────────

export const Producties: CollectionConfig = {
  slug: 'producties',
  labels: { singular: 'Productie', plural: 'Producties' },
  admin: {
    useAsTitle: 'order',
    group: GROEP,
    defaultColumns: ['order', 'updatedAt'],
    description: 'De order uitgesplitst tot recept- en ingrediëntniveau, geschaald naar gastenaantal.',
  },
  access: logistiekToegang,
  fields: [
    { name: 'order', type: 'relationship', relationTo: 'orders', required: true, unique: true, label: 'Order' },
    berekendeRegels([
      { name: 'product', type: 'text', label: 'Product-id' },
      { name: 'productNaam', type: 'text', label: 'Product' },
      { name: 'recept', type: 'text', label: 'Recept-id' },
      { name: 'receptNaam', type: 'text', label: 'Recept' },
      { name: 'keukenstation', type: 'text', label: 'Keukenstation' },
      { name: 'aantalGasten', type: 'number', label: 'Aantal gasten' },
      { name: 'hoeveelheidPerPersoon', type: 'number', label: 'Hoeveelheid per persoon' },
      { name: 'eenheid', type: 'text', label: 'Eenheid' },
      { name: 'productHoeveelheid', type: 'number', label: 'Producthoeveelheid' },
      { name: 'kostprijs', type: 'number', label: 'Kostprijs' },
      {
        name: 'ingredienten',
        type: 'array',
        label: 'Ingrediënten',
        fields: [
          { name: 'ingredient', type: 'text', label: 'Ingrediënt-id' },
          { name: 'naam', type: 'text', label: 'Ingrediënt' },
          { name: 'hoeveelheid', type: 'number', label: 'Hoeveelheid (exact)' },
          { name: 'basisEenheid', type: 'text', label: 'Eenheid' },
          { name: 'kostprijs', type: 'number', label: 'Kostprijs' },
        ],
      },
    ]),
    {
      name: 'keukenlijstNotities',
      type: 'textarea',
      label: 'Keukenlijst-notities',
      admin: { description: 'Vrije instructies bovenop de gegenereerde productieregels.' },
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// §3.13 Inkoop — geaggregeerd over evenementen in een periode
// ─────────────────────────────────────────────────────────────────────────────

export const Inkopen: CollectionConfig = {
  slug: 'inkopen',
  labels: { singular: 'Inkooplijst', plural: 'Inkooplijsten' },
  admin: {
    useAsTitle: 'periodeTot',
    group: GROEP,
    defaultColumns: ['periodeVan', 'periodeTot', 'updatedAt'],
    description: 'Ingrediëntbehoefte over álle evenementen in de periode, gegroepeerd per leverancier.',
  },
  access: logistiekToegang,
  fields: [
    { name: 'periodeVan', type: 'date', required: true, label: 'Periode van' },
    { name: 'periodeTot', type: 'date', required: true, index: true, label: 'Periode tot' },
    {
      name: 'regels',
      type: 'array',
      label: 'Inkoopregels',
      admin: { readOnly: true },
      fields: [
        { name: 'ingredient', type: 'text', label: 'Ingrediënt-id' },
        { name: 'naam', type: 'text', label: 'Ingrediënt' },
        { name: 'hoeveelheid', type: 'number', label: 'In te kopen hoeveelheid' },
        { name: 'inkoopEenheid', type: 'text', label: 'Inkoopeenheid' },
        { name: 'eenheidsprijs', type: 'number', label: 'Eenheidsprijs' },
        { name: 'kostprijs', type: 'number', label: 'Kostprijs' },
        { name: 'leverancier', type: 'text', label: 'Leverancier-id' },
        { name: 'leverancierNaam', type: 'text', label: 'Leverancier' },
        { name: 'herkomst', type: 'text', hasMany: true, label: 'Herkomst (evenementen)' },
      ],
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// §3.14 Picking — gecombineerde paklijst, afvinkbaar
// ─────────────────────────────────────────────────────────────────────────────

export const Pickings: CollectionConfig = {
  slug: 'pickings',
  labels: { singular: 'Paklijst', plural: 'Paklijsten' },
  admin: {
    useAsTitle: 'order',
    group: GROEP,
    defaultColumns: ['order', 'status', 'afgevinktOp'],
    description: 'Voedsel uit de productie plus materialen uit het evenement, in één afvinkbare lijst.',
  },
  access: logistiekToegang,
  fields: [
    { name: 'order', type: 'relationship', relationTo: 'orders', required: true, unique: true, label: 'Order' },
    {
      name: 'regels',
      type: 'array',
      label: 'Regels',
      fields: [
        {
          name: 'soort',
          type: 'select',
          required: true,
          options: [
            { label: 'Voedsel', value: 'voedsel' },
            { label: 'Materiaal', value: 'materiaal' },
          ],
          label: 'Soort',
        },
        { name: 'referentie', type: 'text', label: 'Referentie-id' },
        { name: 'omschrijving', type: 'text', label: 'Omschrijving' },
        { name: 'hoeveelheid', type: 'number', label: 'Hoeveelheid' },
        { name: 'eenheid', type: 'text', label: 'Eenheid' },
        { name: 'afgevinkt', type: 'checkbox', defaultValue: false, label: 'Afgevinkt' },
      ],
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'open',
      options: [
        { label: nl.status.paklijst.open, value: 'open' },
        { label: nl.status.paklijst.afgevinkt, value: 'afgevinkt' },
      ],
      label: 'Status',
    },
    { name: 'afgevinktDoor', type: 'relationship', relationTo: 'gebruikers', label: 'Afgevinkt door' },
    { name: 'afgevinktOp', type: 'date', label: 'Afgevinkt op' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// §3.15 Levering
// ─────────────────────────────────────────────────────────────────────────────

export const Leveringen: CollectionConfig = {
  slug: 'leveringen',
  labels: { singular: 'Levering', plural: 'Leveringen' },
  admin: {
    useAsTitle: 'order',
    group: GROEP,
    defaultColumns: ['order', 'leverdatum', 'levertijd', 'status'],
  },
  access: logistiekToegang,
  fields: [
    { name: 'order', type: 'relationship', relationTo: 'orders', required: true, unique: true, label: 'Order' },
    { name: 'leverdatum', type: 'date', required: true, label: 'Leverdatum' },
    { name: 'levertijd', type: 'text', required: true, label: 'Levertijd', admin: { description: 'Bv. 16:30.' } },
    adresVeld('adres', 'Leveradres'),
    { name: 'verantwoordelijke', type: 'text', label: 'Verantwoordelijke' },
    statusVeld('status', LEVERING_STATUS, nl.status.levering, 'gepland'),
  ],
};

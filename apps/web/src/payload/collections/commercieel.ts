import type { CollectionConfig, Field } from 'payload';
import { FACTUUR_STATUS, OFFERTE_STATUS, ORDER_STATUS } from '@foodbook/shared-types';
import { en } from '@foodbook/i18n';
import { bepaalVolgendFactuurNummer } from '@foodbook/calculation-engine';
import { verkoopToegang } from '../access/rollen';
import { statusVeld } from '../velden';

const GROEP = 'Verkoop & facturatie';

/** Bevroren btw-uitsplitsing per tarief (§3.10/§3.16). */
const btwUitsplitsingVeld: Field = {
  name: 'btwUitsplitsing',
  type: 'array',
  label: 'Btw per tarief',
  admin: { readOnly: true, description: 'Bevroren op het moment van aanmaken.' },
  fields: [
    { name: 'btwTarief', type: 'text', label: 'Tarief-id' },
    { name: 'naam', type: 'text', label: 'Naam' },
    { name: 'percentage', type: 'number', label: 'Percentage' },
    { name: 'grondslag', type: 'number', label: 'Grondslag' },
    { name: 'btwBedrag', type: 'number', label: 'Btw-bedrag' },
  ],
};

const totalenVelden: Field[] = [
  { name: 'subtotaal', type: 'number', label: 'Subtotaal', admin: { readOnly: true } },
  { name: 'btwTotaal', type: 'number', label: 'Btw-totaal', admin: { readOnly: true } },
  { name: 'totaal', type: 'number', label: 'Totaal', admin: { readOnly: true } },
];

// ─────────────────────────────────────────────────────────────────────────────
// §3.10 Offertes — bevroren snapshot met versiebeheer
// ─────────────────────────────────────────────────────────────────────────────

export const Offertes: CollectionConfig = {
  slug: 'offertes',
  labels: { singular: 'Offerte', plural: 'Offertes' },
  admin: {
    useAsTitle: 'versie',
    group: GROEP,
    defaultColumns: ['event', 'versie', 'status', 'geldigTot', 'totaal'],
    description:
      'Een offerte is een bevroren snapshot. Een latere prijswijziging verandert een verzonden offerte niet meer.',
  },
  access: verkoopToegang,
  fields: [
    { name: 'event', type: 'relationship', relationTo: 'evenementen', required: true, label: 'Evenement' },
    { name: 'versie', type: 'number', required: true, defaultValue: 1, min: 1, label: 'Versie', admin: { readOnly: true } },
    {
      name: 'regels',
      type: 'array',
      label: 'Regels',
      admin: { readOnly: true, description: 'Bevroren op het moment van genereren.' },
      fields: [
        { name: 'product', type: 'text', label: 'Product-id' },
        { name: 'productNaam', type: 'text', label: 'Product' },
        { name: 'aantalGasten', type: 'number', label: 'Aantal gasten' },
        { name: 'hoeveelheidPerPersoon', type: 'number', label: 'Hoeveelheid per persoon' },
        { name: 'eenheid', type: 'text', label: 'Eenheid' },
        { name: 'prijsPerPersoon', type: 'number', label: 'Prijs per persoon' },
        { name: 'btwTarief', type: 'text', label: 'Btw-tarief-id' },
        { name: 'btwPercentage', type: 'number', label: 'Btw-percentage' },
        { name: 'regelTotaalExcl', type: 'number', label: 'Regeltotaal excl.' },
        { name: 'btwBedrag', type: 'number', label: 'Btw-bedrag' },
        { name: 'regelTotaalIncl', type: 'number', label: 'Regeltotaal incl.' },
      ],
    },
    btwUitsplitsingVeld,
    ...totalenVelden,
    statusVeld('status', OFFERTE_STATUS, en.status.offerte, 'concept'),
    { name: 'geldigTot', type: 'date', required: true, label: 'Geldig tot' },
    { name: 'notities', type: 'textarea', label: 'Notities' },
    { name: 'pdfBestand', type: 'upload', relationTo: 'media', label: 'PDF', admin: { readOnly: true } },
  ],
  hooks: {
    beforeChange: [
      /**
       * §3.10 — elke nieuwe offerte voor hetzelfde evenement krijgt een nieuw versienummer.
       * Oude versies blijven bestaan, zodat er altijd een spoor is van wat er is verzonden.
       */
      async ({ data, operation, req }) => {
        if (operation !== 'create') return data;
        const eventId = typeof data.event === 'object' ? data.event?.id : data.event;
        if (eventId === undefined) return data;

        const bestaand = await req.payload.find({
          collection: 'offertes',
          where: { event: { equals: eventId } },
          sort: '-versie',
          limit: 1,
          req,
        });

        const hoogste = bestaand.docs[0]?.versie;
        return { ...data, versie: (typeof hoogste === 'number' ? hoogste : 0) + 1 };
      },
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// §3.11 Orders
// ─────────────────────────────────────────────────────────────────────────────

export const Orders: CollectionConfig = {
  slug: 'orders',
  labels: { singular: 'Order', plural: 'Orders' },
  admin: {
    useAsTitle: 'id',
    group: GROEP,
    defaultColumns: ['event', 'offerte', 'status', 'bevestigingsdatum'],
    description: 'Een geaccepteerde offerte wordt een order: dezelfde data, nu definitief.',
  },
  access: verkoopToegang,
  fields: [
    { name: 'event', type: 'relationship', relationTo: 'evenementen', required: true, label: 'Evenement' },
    {
      name: 'offerte',
      type: 'relationship',
      relationTo: 'offertes',
      required: true,
      label: 'Geaccepteerde offerte',
    },
    statusVeld('status', ORDER_STATUS, en.status.order, 'bevestigd'),
    { name: 'bevestigingsdatum', type: 'date', required: true, label: 'Bevestigingsdatum' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// §3.16 Facturen — gapless sequentiële nummering
// ─────────────────────────────────────────────────────────────────────────────

export const Facturen: CollectionConfig = {
  slug: 'facturen',
  labels: { singular: 'Factuur', plural: 'Facturen' },
  admin: {
    useAsTitle: 'factuurnummer',
    group: GROEP,
    defaultColumns: ['factuurnummer', 'order', 'factuurdatum', 'vervaldatum', 'status', 'totaal'],
    description:
      'Het factuurnummer wordt automatisch toegekend en is oplopend zonder gaten — wettelijk verplicht en niet handmatig te wijzigen.',
  },
  access: verkoopToegang,
  fields: [
    { name: 'order', type: 'relationship', relationTo: 'orders', required: true, label: 'Order' },
    {
      name: 'factuurnummer',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Factuurnummer',
      admin: { readOnly: true, description: 'Automatisch bepaald; nooit hergebruikt.' },
    },
    { name: 'factuurdatum', type: 'date', required: true, label: 'Factuurdatum' },
    { name: 'vervaldatum', type: 'date', required: true, label: 'Vervaldatum' },
    {
      name: 'regels',
      type: 'array',
      label: 'Regels',
      admin: { readOnly: true, description: 'Bevroren op het moment van factureren.' },
      fields: [
        { name: 'omschrijving', type: 'text', label: 'Omschrijving' },
        { name: 'aantal', type: 'number', label: 'Aantal' },
        { name: 'eenheidsprijs', type: 'number', label: 'Eenheidsprijs' },
        { name: 'btwTarief', type: 'text', label: 'Btw-tarief-id' },
        { name: 'btwPercentage', type: 'number', label: 'Btw-percentage' },
        { name: 'regelTotaalExcl', type: 'number', label: 'Regeltotaal excl.' },
        { name: 'btwBedrag', type: 'number', label: 'Btw-bedrag' },
        { name: 'regelTotaalIncl', type: 'number', label: 'Regeltotaal incl.' },
      ],
    },
    btwUitsplitsingVeld,
    ...totalenVelden,
    statusVeld('status', FACTUUR_STATUS, en.status.factuur, 'concept'),
    {
      name: 'creditVan',
      type: 'relationship',
      relationTo: 'facturen',
      label: 'Creditfactuur van',
      admin: { description: 'Een creditfactuur krijgt een eigen nieuw nummer; bestaande nummers blijven intact.' },
    },
    { name: 'pdfBestand', type: 'upload', relationTo: 'media', label: 'PDF', admin: { readOnly: true } },
  ],
  hooks: {
    beforeValidate: [
      /**
       * §3.16 — kent het volgende factuurnummer toe volgens `bepaalVolgendFactuurNummer`
       * uit de rekenmotor: oplopend op basis van het hoogste bestaande nummer binnen hetzelfde
       * jaar en dezelfde prefix, zodat een gat nooit wordt opgevuld en een nummer nooit
       * opnieuw wordt uitgegeven.
       *
       * Let op: dit is niet transactieve rijvergrendeling. Bij gelijktijdig aanmaken vanaf
       * meerdere werkplekken hoort hier een database-lock omheen; in de v1-desktopopstelling
       * (één gebruiker per installatie) is dat niet nodig.
       */
      async ({ data, operation, req }) => {
        if (operation !== 'create' || data === undefined) return data;
        if (typeof data.factuurnummer === 'string' && data.factuurnummer.length > 0) return data;

        const instellingen = await req.payload.findGlobal({ slug: 'bedrijfsinstellingen', req });
        const prefix =
          typeof instellingen?.factuurPrefix === 'string' && instellingen.factuurPrefix.length > 0
            ? instellingen.factuurPrefix
            : 'F';

        const datum =
          typeof data.factuurdatum === 'string' && data.factuurdatum.length > 0
            ? data.factuurdatum
            : new Date().toISOString().slice(0, 10);
        const jaar = Number(datum.slice(0, 4));

        const bestaand = await req.payload.find({
          collection: 'facturen',
          pagination: false,
          select: { factuurnummer: true },
          req,
        });

        const nummers = bestaand.docs
          .map((document) => document.factuurnummer)
          .filter((nummer): nummer is string => typeof nummer === 'string');

        return { ...data, factuurnummer: bepaalVolgendFactuurNummer(nummers, { prefix, jaar }) };
      },
    ],
  },
};

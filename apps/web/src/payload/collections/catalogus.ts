import type { CollectionConfig } from 'payload';
import {
  alleenBeheerderSchrijft,
  heeftRol,
  iedereenBewerkt,
  isBeheerder,
  isIngelogd,
} from '../access/rollen';
import { eenheidOpties } from '../velden';

const GROEP_CATALOGUS = 'Catalogus';

// ─────────────────────────────────────────────────────────────────────────────
// §3.4 Allergenen — 14 wettelijke EU-allergenen, geseed bij installatie
// ─────────────────────────────────────────────────────────────────────────────

export const Allergenen: CollectionConfig = {
  slug: 'allergenen',
  labels: { singular: 'Allergeen', plural: 'Allergenen' },
  admin: {
    useAsTitle: 'naam',
    group: GROEP_CATALOGUS,
    defaultColumns: ['naam', 'wettelijkeCode'],
    description: 'De wettelijke allergenenlijst. Wijzigt zelden; alleen de beheerder beheert deze.',
  },
  access: alleenBeheerderSchrijft,
  fields: [
    { name: 'naam', type: 'text', required: true, label: 'Naam' },
    {
      name: 'wettelijkeCode',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      label: 'Wettelijke code',
      admin: { description: 'Code voor audit-traceerbaarheid, bv. GLUTEN.' },
    },
    { name: 'icoon', type: 'upload', relationTo: 'media', label: 'Icoon' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// §3.5 Btw-tarieven
// ─────────────────────────────────────────────────────────────────────────────

export const BtwTarieven: CollectionConfig = {
  slug: 'btw-tarieven',
  labels: { singular: 'Btw-tarief', plural: 'Btw-tarieven' },
  admin: {
    useAsTitle: 'naam',
    group: GROEP_CATALOGUS,
    defaultColumns: ['naam', 'percentage', 'standaard'],
    description: 'Catering is doorgaans 9%, alcohol en enkele artikelen 21%.',
  },
  access: alleenBeheerderSchrijft,
  fields: [
    { name: 'naam', type: 'text', required: true, label: 'Naam' },
    {
      name: 'percentage',
      type: 'number',
      required: true,
      min: 0,
      max: 100,
      label: 'Percentage',
      admin: { description: 'Vul 9 of 21 in, niet 0,09.' },
    },
    {
      name: 'standaard',
      type: 'checkbox',
      defaultValue: false,
      label: 'Standaardtarief',
      admin: { description: 'Vooraf ingevuld bij een nieuw product.' },
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Categorieën en seizoenen (§3.1)
// ─────────────────────────────────────────────────────────────────────────────

export const Categorieen: CollectionConfig = {
  slug: 'categorieen',
  labels: { singular: 'Categorie', plural: 'Categorieën' },
  admin: { useAsTitle: 'naam', group: GROEP_CATALOGUS, defaultColumns: ['naam', 'volgorde'] },
  access: iedereenBewerkt,
  fields: [
    { name: 'naam', type: 'text', required: true, label: 'Naam' },
    { name: 'volgorde', type: 'number', defaultValue: 0, label: 'Volgorde' },
  ],
};

export const Seizoenen: CollectionConfig = {
  slug: 'seizoenen',
  labels: { singular: 'Seizoen', plural: 'Seizoenen' },
  admin: { useAsTitle: 'naam', group: GROEP_CATALOGUS },
  access: iedereenBewerkt,
  fields: [{ name: 'naam', type: 'text', required: true, label: 'Naam' }],
};

// ─────────────────────────────────────────────────────────────────────────────
// §3.3 Leveranciers en ingrediënten
// ─────────────────────────────────────────────────────────────────────────────

export const Leveranciers: CollectionConfig = {
  slug: 'leveranciers',
  labels: { singular: 'Leverancier', plural: 'Leveranciers' },
  admin: {
    useAsTitle: 'naam',
    group: GROEP_CATALOGUS,
    defaultColumns: ['naam', 'contactpersoon', 'email'],
  },
  access: {
    read: isIngelogd,
    create: heeftRol('beheerder', 'keuken'),
    update: heeftRol('beheerder', 'keuken'),
    delete: isBeheerder,
  },
  fields: [
    { name: 'naam', type: 'text', required: true, label: 'Naam' },
    { name: 'contactpersoon', type: 'text', label: 'Contactpersoon' },
    { name: 'email', type: 'email', label: 'E-mailadres' },
    { name: 'telefoon', type: 'text', label: 'Telefoon' },
  ],
};

export const Ingredienten: CollectionConfig = {
  slug: 'ingredienten',
  labels: { singular: 'Ingrediënt', plural: 'Ingrediënten' },
  admin: {
    useAsTitle: 'naam',
    group: GROEP_CATALOGUS,
    defaultColumns: ['naam', 'inkoopeenheid', 'inkoopprijs', 'leverancier'],
    description: 'De bron van waarheid voor allergenen en inkoopprijzen.',
  },
  access: {
    read: isIngelogd,
    create: heeftRol('beheerder', 'keuken'),
    update: heeftRol('beheerder', 'keuken'),
    delete: isBeheerder,
  },
  fields: [
    { name: 'naam', type: 'text', required: true, index: true, label: 'Naam' },
    {
      name: 'inkoopeenheid',
      type: 'select',
      required: true,
      options: eenheidOpties(),
      label: 'Inkoopeenheid',
    },
    {
      name: 'inkoopprijs',
      type: 'number',
      required: true,
      min: 0,
      label: 'Inkoopprijs',
      admin: { description: 'Prijs per één inkoopeenheid, exclusief btw.' },
    },
    { name: 'leverancier', type: 'relationship', relationTo: 'leveranciers', label: 'Leverancier' },
    {
      name: 'allergenen',
      type: 'relationship',
      relationTo: 'allergenen',
      hasMany: true,
      label: 'Allergenen',
      admin: {
        description: 'Op ingrediëntniveau vastleggen; de allergenen van recepten en producten volgen hieruit.',
      },
    },
    { name: 'houdbaarheidDagen', type: 'number', min: 0, label: 'Houdbaarheid (dagen)' },
    {
      name: 'voorraad',
      type: 'number',
      min: 0,
      label: 'Voorraad',
      admin: { description: 'In de inkoopeenheid. Wordt afgetrokken van de inkoopbehoefte.' },
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// §3.2 Recepten
// ─────────────────────────────────────────────────────────────────────────────

export const Recepten: CollectionConfig = {
  slug: 'recepten',
  labels: { singular: 'Recept', plural: 'Recepten' },
  admin: {
    useAsTitle: 'naam',
    group: GROEP_CATALOGUS,
    defaultColumns: ['naam', 'basisPorties', 'hoeveelheidPerPersoon', 'kooktijdMinuten'],
  },
  access: {
    read: isIngelogd,
    create: heeftRol('beheerder', 'keuken'),
    update: heeftRol('beheerder', 'keuken'),
    delete: isBeheerder,
  },
  fields: [
    { name: 'naam', type: 'text', required: true, label: 'Naam' },
    {
      name: 'basisPorties',
      type: 'number',
      required: true,
      min: 0.01,
      label: 'Basisporties',
      admin: { description: 'Aantal porties waarvoor dit recept geschreven is, bv. 10.' },
    },
    {
      name: 'hoeveelheidPerPersoon',
      type: 'number',
      required: true,
      min: 0.01,
      label: 'Standaardportie per persoon',
      admin: {
        description:
          'De portiegrootte waarop de regels hieronder zijn gebaseerd. De rekenmotor gebruikt dit als ijkpunt.',
      },
    },
    { name: 'eenheid', type: 'select', required: true, options: eenheidOpties(), label: 'Eenheid' },
    {
      name: 'ingredienten',
      type: 'array',
      required: true,
      minRows: 1,
      labels: { singular: 'Ingrediëntregel', plural: 'Ingrediënten' },
      label: 'Ingrediënten',
      admin: { description: 'Hoeveelheden voor het volledige recept, niet per persoon.' },
      fields: [
        { name: 'ingredient', type: 'relationship', relationTo: 'ingredienten', required: true, label: 'Ingrediënt' },
        { name: 'hoeveelheid', type: 'number', required: true, min: 0.001, label: 'Hoeveelheid' },
        { name: 'eenheid', type: 'select', required: true, options: eenheidOpties(), label: 'Eenheid' },
      ],
    },
    { name: 'bereidingswijze', type: 'textarea', label: 'Bereidingswijze' },
    { name: 'kooktijdMinuten', type: 'number', min: 0, label: 'Kooktijd (minuten)' },
    {
      name: 'keukenstation',
      type: 'text',
      label: 'Keukenstation',
      admin: { description: 'Groepeert de regels op de productielijst, bv. "Warme keuken".' },
    },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// §3.1 Producten
// ─────────────────────────────────────────────────────────────────────────────

export const Producten: CollectionConfig = {
  slug: 'producten',
  labels: { singular: 'Product', plural: 'Producten' },
  admin: {
    useAsTitle: 'naam',
    group: GROEP_CATALOGUS,
    defaultColumns: ['naam', 'categorie', 'hoeveelheidPerPersoon', 'prijsPerPersoon', 'actief'],
    description: 'Het verkoopbare item dat in de Foodbook getoond wordt.',
  },
  access: {
    read: isIngelogd,
    create: heeftRol('beheerder', 'keuken'),
    update: heeftRol('beheerder', 'keuken'),
    delete: isBeheerder,
  },
  fields: [
    { name: 'naam', type: 'text', required: true, index: true, label: 'Naam' },
    { name: 'beschrijving', type: 'richText', label: 'Beschrijving' },
    { name: 'categorie', type: 'relationship', relationTo: 'categorieen', required: true, label: 'Categorie' },
    {
      name: 'fotos',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: "Foto's",
      admin: { description: 'Sleep om te herordenen; de eerste foto is de hoofdfoto.' },
    },
    {
      name: 'hoofdfoto',
      type: 'upload',
      relationTo: 'media',
      label: 'Hoofdfoto',
      admin: { description: 'Moet onderdeel zijn van de fotolijst hierboven.' },
    },
    { name: 'portiesBasis', type: 'number', required: true, defaultValue: 1, min: 0.01, label: 'Porties (basis)' },
    { name: 'eenheid', type: 'select', required: true, options: eenheidOpties(), label: 'Eenheid' },
    {
      name: 'hoeveelheidPerPersoon',
      type: 'number',
      required: true,
      min: 0.001,
      label: 'Hoeveelheid per persoon',
      admin: {
        description:
          'Het veld dat de rekenmotor schaalt. Een wijziging werkt door op open evenementen, nooit op al verzonden offertes of facturen.',
      },
    },
    { name: 'recept', type: 'relationship', relationTo: 'recepten', label: 'Recept' },
    {
      name: 'prijsPerPersoon',
      type: 'number',
      required: true,
      min: 0,
      label: 'Prijs per persoon (excl. btw)',
    },
    { name: 'btwTarief', type: 'relationship', relationTo: 'btw-tarieven', required: true, label: 'Btw-tarief' },
    {
      name: 'allergenen',
      type: 'relationship',
      relationTo: 'allergenen',
      hasMany: true,
      label: 'Allergenen (aanvullend)',
      admin: {
        description:
          'Alleen voor artikelen zonder recept. De allergenen uit het recept worden automatisch toegevoegd.',
      },
    },
    { name: 'actief', type: 'checkbox', defaultValue: true, label: 'Actief', admin: { description: 'Uit = verborgen in de Foodbook, niet verwijderd.' } },
    { name: 'seizoen', type: 'relationship', relationTo: 'seizoenen', label: 'Seizoen' },
    {
      name: 'materialen',
      type: 'array',
      label: 'Benodigde materialen',
      labels: { singular: 'Materiaalregel', plural: 'Materialen' },
      admin: {
        description:
          'Materialen die standaard bij dit gerecht horen, gerekend naar het aantal gasten. Eén bord per gast is 1 per 1; één warmhoudplaat per 50 gasten is 1 per 50. Per evenement kan dit later handmatig worden aangevuld.',
      },
      fields: [
        {
          name: 'materiaal',
          type: 'relationship',
          relationTo: 'materialen',
          required: true,
          label: 'Materiaal',
        },
        {
          name: 'hoeveelheid',
          type: 'number',
          required: true,
          min: 0,
          defaultValue: 1,
          label: 'Hoeveelheid',
        },
        {
          name: 'perAantalGasten',
          type: 'number',
          required: true,
          min: 1,
          defaultValue: 1,
          label: 'Per aantal gasten',
          admin: { description: 'Laat op 1 staan voor "per gast".' },
        },
      ],
    },
  ],
};

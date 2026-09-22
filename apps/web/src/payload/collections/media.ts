import type { CollectionConfig } from 'payload';
import { heeftRol, isIngelogd } from '../access/rollen';

/**
 * §3.9 Media / fotobeheer.
 *
 * Dit is een eigen, eersteklas collectie en geen bijlageveld: de klant vroeg expliciet om
 * zelfstandig fotobeheer zonder ontwikkelaar. Payload genereert de vier varianten uit
 * ARCHITECTURE.md §5 met sharp, en levert de crop-/focuspunt-tool en het vervangen van een
 * bestand (waarbij het record en dus de positie in de fotolijst behouden blijft) uit zichzelf.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'Foto', plural: "Foto's" },
  admin: {
    useAsTitle: 'altTekst',
    group: 'Media',
    defaultColumns: ['altTekst', 'bestandsnaam', 'volgorde', 'updatedAt'],
    description:
      'Upload meerdere foto’s tegelijk, sleep om te herordenen, kies een hoofdfoto. Bijsnijden en verkleinen gebeurt automatisch.',
  },
  access: {
    read: isIngelogd,
    create: isIngelogd,
    update: isIngelogd,
    delete: heeftRol('beheerder', 'keuken'),
  },
  upload: {
    // Map waarin de bestanden komen. In productie een volume dat buiten de container bewaard
    // blijft, zodat een nieuwe uitrol de foto's niet weggooit. Zie docs/DEPLOY.md.
    staticDir: process.env.MEDIA_DIR ?? 'media',
    mimeTypes: ['image/*'],
    focalPoint: true,
    crop: true,
    adminThumbnail: 'thumbnail',
    // Vaste verhoudingen die aansluiten op de Foodbook-weergave, ongeacht het bronformaat.
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 400, position: 'centre' },
      { name: 'foodbook-card', width: 800, height: 600, position: 'centre' },
      { name: 'foodbook-hero', width: 1920, height: 1080, position: 'centre' },
      { name: 'print', width: 2480, height: 3508, position: 'centre' },
    ],
  },
  fields: [
    {
      name: 'altTekst',
      type: 'text',
      required: true,
      label: 'Alt-tekst',
      admin: {
        description:
          'Beschrijft de foto voor toegankelijkheid, en is herbruikbaar als de Foodbook ooit als webpagina verschijnt.',
      },
    },
    {
      name: 'volgorde',
      type: 'number',
      defaultValue: 0,
      label: 'Volgorde',
      admin: { description: 'Bepaalt de volgorde binnen het product.' },
    },
  ],
  hooks: {
    beforeDelete: [
      // Voorkomt dat een foto verdwijnt die nog als hoofdfoto van een product in gebruik is.
      async ({ id, req }) => {
        const inGebruik = await req.payload.count({
          collection: 'producten',
          where: { or: [{ hoofdfoto: { equals: id } }, { fotos: { in: [id] } }] },
          req,
        });

        if (inGebruik.totalDocs > 0) {
          throw new Error(`Deze foto is nog aan ${inGebruik.totalDocs} product(en) gekoppeld.`);
        }
      },
    ],
  },
};

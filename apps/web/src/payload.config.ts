import path from 'path';
import { fileURLToPath } from 'url';

import { postgresAdapter } from '@payloadcms/db-postgres';
import { sqliteAdapter } from '@payloadcms/db-sqlite';
import { lexicalEditor } from '@payloadcms/richtext-lexical';
import { en as payloadEn } from '@payloadcms/translations/languages/en';
import { buildConfig } from 'payload';
import sharp from 'sharp';

import { Allergenen, BtwTarieven, Categorieen, Ingredienten, Leveranciers, Producten, Recepten, Seizoenen } from './payload/collections/catalogus';
import { Facturen, Offertes, Orders } from './payload/collections/commercieel';
import { Bedrijfsinstellingen, Gebruikers, Verzendlog } from './payload/collections/instellingen';
import { Media } from './payload/collections/media';
import { Inkopen, Leveringen, Pickings, Producties } from './payload/collections/operatie';
import { Evenementen, Klanten, Materialen } from './payload/collections/relaties';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

/**
 * Kiest de database op basis van de omgeving.
 *
 * - **Zonder `DATABASE_URI`** → SQLite, een lokaal bestand. Bedoeld om de applicatie te kunnen
 *   starten en testen zonder dat er iets geïnstalleerd hoeft te worden: geen Docker, geen
 *   databaseserver. Dit is de modus waarin de klant zelf kan meekijken en rekenen.
 * - **Met `DATABASE_URI`** → PostgreSQL, de opzet uit ARCHITECTURE.md §2 en de database waarin
 *   het systeem uiteindelijk bij de klant draait.
 *
 * Let op: dit is een bewuste ontwikkel-/testvoorziening, geen productiekeuze. Zware invoering
 * hoort tegen PostgreSQL getest te worden, omdat de twee databases zich op details anders
 * gedragen. Zie BESLISSINGEN.md.
 */
function kiesDatabase() {
  const postgresUri = process.env.DATABASE_URI;
  const isProductie = process.env.NODE_ENV === 'production';

  if (postgresUri !== undefined && postgresUri.length > 0) {
    return postgresAdapter({
      pool: { connectionString: postgresUri },
      // Migraties staan in de repo zodat een uitrol herhaalbaar is.
      migrationDir: path.resolve(dirname, 'migrations'),
      push: magSchemaAanpassen(isProductie),
    });
  }

  return sqliteAdapter({
    client: { url: process.env.SQLITE_URI ?? 'file:./foodbook.db' },
    push: magSchemaAanpassen(isProductie),
  });
}

/**
 * Mag Payload het databaseschema zelf aanpassen?
 *
 * Buiten productie altijd, dat is het gewone ontwikkelgedrag. In productie alleen wanneer
 * `DB_PUSH=true` expliciet is gezet.
 *
 * Die uitzondering is er voor **de allereerste uitrol op een lege database**: zonder deze
 * mogelijkheid zou de applicatie starten tegen een database zonder enige tabel, en zou er geen
 * enkele migratie zijn om dat op te lossen. Zodra er echte gegevens in staan, moet `DB_PUSH`
 * weer uit — vanaf dat moment gaat het schema uitsluitend via migraties, zodat een uitrol nooit
 * gegevens kan wegvagen. Zie docs/DEPLOY.md.
 */
function magSchemaAanpassen(isProductie: boolean): boolean {
  if (!isProductie) return true;
  return process.env.DB_PUSH === 'true';
}

export default buildConfig({
  admin: {
    user: Gebruikers.slug,
    importMap: { baseDir: path.resolve(dirname) },
    meta: {
      titleSuffix: ' — Foodbook',
    },
  },

  // The admin panel is in English, as is everything the application itself shows.
  i18n: {
    supportedLanguages: { en: payloadEn },
    fallbackLanguage: 'en',
  },

  collections: [
    // Catalogus (§3.1–§3.5)
    Producten,
    Recepten,
    Ingredienten,
    Allergenen,
    BtwTarieven,
    Categorieen,
    Seizoenen,
    Leveranciers,
    // Media (§3.9)
    Media,
    // Klanten & evenementen (§3.6–§3.8)
    Klanten,
    Evenementen,
    Materialen,
    // Verkoop & facturatie (§3.10, §3.11, §3.16)
    Offertes,
    Orders,
    Facturen,
    // Operatie (§3.12–§3.15)
    Producties,
    Inkopen,
    Pickings,
    Leveringen,
    // Instellingen (§3.17)
    Gebruikers,
    Verzendlog,
  ],

  globals: [Bedrijfsinstellingen],

  editor: lexicalEditor(),

  secret: process.env.PAYLOAD_SECRET ?? '',

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  db: kiesDatabase(),

  sharp,

  upload: {
    limits: {
      // Ruime grens: foto's komen rechtstreeks van camera's en telefoons binnen.
      fileSize: 25_000_000,
    },
  },
});

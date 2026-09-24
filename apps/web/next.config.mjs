import path from 'path';
import { fileURLToPath } from 'url';

import { withPayload } from '@payloadcms/next/withPayload';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const serverUrl = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000';
const mediaUrl = new URL(serverUrl);

/**
 * De vier @foodbook-pakketten worden als TypeScript-bron geconsumeerd (`main` wijst naar
 * `src/index.ts`), zodat er geen aparte buildstap nodig is tussen de pakketten en de app.
 */
const volgendeConfig = {
  // Zelfstandige serveroutput: één map met alleen de meegecompileerde app en de gebruikte
  // dependencies. Dat is wat de Docker-image in productie draait (zie Dockerfile).
  output: 'standalone',

  // In een monorepo moet Next weten waar de wortel is, anders worden de workspace-pakketten
  // niet in de zelfstandige output meegenomen.
  outputFileTracingRoot: path.join(dirname, '../..'),

  transpilePackages: [
    '@foodbook/calculation-engine',
    '@foodbook/documents',
    '@foodbook/i18n',
    '@foodbook/shared-types',
  ],

  images: {
    // Payload levert foto-URL's met het geconfigureerde serveradres; die moeten door
    // next/image geoptimaliseerd mogen worden.
    remotePatterns: [
      {
        protocol: mediaUrl.protocol.replace(':', '') === 'https' ? 'https' : 'http',
        hostname: mediaUrl.hostname,
        ...(mediaUrl.port.length > 0 ? { port: mediaUrl.port } : {}),
        pathname: '/api/media/**',
      },
    ],
  },

  /**
   * De bouw draait in een container op een droplet met één vCPU en twee GB geheugen, terwijl
   * Postgres, Caddy en de draaiende app daar ook staan. Next verdeelt het compileren standaard
   * over meerdere processen; op deze machine is dat te veel. Het geheugen raakt vol, de kernel
   * gaat wisselen en de server reageert helemaal niet meer — ook niet op ssh.
   *
   * Eén compilerproces houdt de piek binnen de beschikbare ruimte. Dat is trager bouwen, maar
   * de machine blijft bereikbaar.
   */
  experimental: {
    cpus: 1,
  },
};

export default withPayload(volgendeConfig);

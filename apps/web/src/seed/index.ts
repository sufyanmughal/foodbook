import config from '@payload-config';
import { getPayload } from 'payload';

import { ALLERGENEN, BTW_TARIEVEN } from './referentie';

/**
 * Vult de wettelijke referentielijsten (§3.4, §3.5) — eenmalig, en idempotent zodat
 * opnieuw draaien geen dubbele records oplevert.
 *
 * Uitvoeren met: npm run seed --workspace @foodbook/web
 */
async function seed(): Promise<void> {
  const payload = await getPayload({ config });

  for (const allergeen of ALLERGENEN) {
    const bestaand = await payload.find({
      collection: 'allergenen',
      where: { wettelijkeCode: { equals: allergeen.wettelijkeCode } },
      limit: 1,
    });

    if (bestaand.totalDocs === 0) {
      await payload.create({ collection: 'allergenen', data: { ...allergeen } });
      payload.logger.info(`Allergeen toegevoegd: ${allergeen.naam}`);
    }
  }

  for (const tarief of BTW_TARIEVEN) {
    const bestaand = await payload.find({
      collection: 'btw-tarieven',
      where: { naam: { equals: tarief.naam } },
      limit: 1,
    });

    if (bestaand.totalDocs === 0) {
      await payload.create({ collection: 'btw-tarieven', data: { ...tarief } });
      payload.logger.info(`Btw-tarief toegevoegd: ${tarief.naam}`);
    }
  }

  payload.logger.info('Referentielijsten bijgewerkt.');
}

await seed();
process.exit(0);

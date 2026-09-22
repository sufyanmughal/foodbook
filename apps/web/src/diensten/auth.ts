import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getPayload, type Payload } from 'payload';

import config from '@payload-config';

/**
 * Zorgt dat een scherm alleen bereikbaar is voor een ingelogde gebruiker.
 *
 * De beheeromgeving van Payload regelt dit zelf, maar de schermen in de Foodbook-groep staan
 * daarbuiten en moeten het expliciet afdwingen. Zonder deze controle zou het rekenscherm
 * openbaar op internet staan.
 */
export async function eisIngelogdeGebruiker(): Promise<{
  payload: Payload;
  gebruiker: { id: string | number; naam?: string; email?: string };
}> {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await headers() });

  if (user === null || user === undefined) {
    redirect('/admin/login');
  }

  return { payload, gebruiker: user };
}

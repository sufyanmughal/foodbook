'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getPayload } from 'payload';

import config from '@payload-config';

import { gastToegangAan, GAST_EMAIL } from './gast';

/**
 * Inloggen op de Foodbook-portal.
 *
 * Dit scherm staat naast de beheeromgeving van Payload en gebruikt dezelfde sessie: na een
 * geslaagde poging wordt het cookie gezet dat `payload.auth()` verwacht. Daardoor werken de
 * rekenschermen en documenten meteen, zonder een tweede inlogsysteem.
 */

export type InlogStand = { fout?: string };

/** De cookienaam die Payload voor de sessie gebruikt. */
const SESSIE_COOKIE = 'payload-token';

const GAST_NAAM = 'Gast';

/**
 * Wachtwoord van de gasttoegang.
 *
 * Bewust afgeleid van PAYLOAD_SECRET in plaats van in de code te staan: zo staat er geen
 * wachtwoord in de repository en is het per omgeving verschillend.
 */
function gastWachtwoord(): string {
  return `gast-${process.env.PAYLOAD_SECRET ?? 'ontwikkeling'}`;
}

async function zetSessie(token: string, exp: number | undefined): Promise<void> {
  const opslag = await cookies();

  const opties: Parameters<typeof opslag.set>[2] = {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    // Bewust niet `secure`: de applicatie draait nu nog op http zonder domein. Zodra er een
    // certificaat is, moet dit aan, anders weigert de browser het cookie te bewaren.
    secure: false,
  };

  // Zonder verloopdatum wordt het een sessiecookie: die verdwijnt als de browser sluit.
  if (exp !== undefined) {
    opties.expires = new Date(exp * 1000);
  }

  opslag.set(SESSIE_COOKIE, token, opties);
}

export async function inloggen(_vorige: InlogStand, formulier: FormData): Promise<InlogStand> {
  const email = String(formulier.get('email') ?? '').trim();
  const wachtwoord = String(formulier.get('wachtwoord') ?? '');

  if (email === '' || wachtwoord === '') {
    return { fout: 'Vul je e-mailadres en wachtwoord in.' };
  }

  const payload = await getPayload({ config });

  try {
    const { token, exp } = await payload.login({
      collection: 'gebruikers',
      data: { email, password: wachtwoord },
    });

    if (token === undefined) {
      return { fout: 'Inloggen is niet gelukt. Probeer het opnieuw.' };
    }

    await zetSessie(token, exp);
  } catch {
    return { fout: 'Dat e-mailadres en dat wachtwoord horen niet bij elkaar.' };
  }

  redirect('/rekenen');
}

export async function inloggenAlsGast(): Promise<InlogStand> {
  if (!gastToegangAan()) {
    return { fout: 'De gasttoegang staat uit op deze omgeving.' };
  }

  const payload = await getPayload({ config });
  const wachtwoord = gastWachtwoord();

  const bestaand = await payload.find({
    collection: 'gebruikers',
    where: { email: { equals: GAST_EMAIL } },
    limit: 1,
    overrideAccess: true,
  });

  const bestaandeGast = bestaand.docs[0];

  try {
    if (bestaandeGast === undefined) {
      await payload.create({
        collection: 'gebruikers',
        data: { naam: GAST_NAAM, email: GAST_EMAIL, rol: 'beheerder', password: wachtwoord },
        overrideAccess: true,
      });
    } else {
      // Het wachtwoord opnieuw zetten, zodat de gasttoegang blijft werken ook als het account
      // eerder met een ander wachtwoord is aangemaakt.
      await payload.update({
        collection: 'gebruikers',
        id: bestaandeGast.id,
        data: { password: wachtwoord },
        overrideAccess: true,
      });
    }

    const { token, exp } = await payload.login({
      collection: 'gebruikers',
      data: { email: GAST_EMAIL, password: wachtwoord },
    });

    if (token === undefined) {
      return { fout: 'De gasttoegang kon niet worden gestart.' };
    }

    await zetSessie(token, exp);
  } catch {
    return { fout: 'De gasttoegang kon niet worden gestart.' };
  }

  redirect('/rekenen');
}

export async function uitloggen(): Promise<void> {
  const opslag = await cookies();
  opslag.delete(SESSIE_COOKIE);
  redirect('/inloggen');
}

/**
 * Instelling van de gasttoegang.
 *
 * Staat bewust niet in acties.ts: een bestand met `'use server'` mag alleen async functies
 * exporteren, en deze controle is synchroon.
 */

/**
 * Is de gasttoegang toegestaan?
 *
 * Standaard aan, zodat het systeem bekeken kan worden zonder eerst gebruikers aan te maken.
 * Zet GAST_TOEGANG=uit in de omgeving voordat dit echt in gebruik gaat.
 */
export function gastToegangAan(): boolean {
  return process.env.GAST_TOEGANG !== 'uit' && process.env.GAST_TOEGANG !== 'false';
}

/** Het e-mailadres van de gasttoegang. */
export const GAST_EMAIL = 'gast@foodbook.local';

import type { Access, FieldAccess } from 'payload';
import type { Rol } from '@foodbook/shared-types';

/**
 * Rolgebaseerde toegangsregels (§3.17).
 *
 * | Rol        | Mag                                                              |
 * |------------|------------------------------------------------------------------|
 * | Beheerder  | alles, inclusief btw-tarieven, allergenen en gebruikersbeheer     |
 * | Verkoop    | klanten, evenementen, offertes, orders                            |
 * | Keuken     | productie-/keukenlijsten, recepten en producten                   |
 * | Logistiek  | picking en levering                                               |
 */
export const ALLE_ROLLEN: Rol[] = ['beheerder', 'verkoop', 'keuken', 'logistiek'];

interface GebruikerMetRol {
  rol?: Rol | Rol[] | null;
}

function rollenVan(user: unknown): Rol[] {
  if (user === null || user === undefined || typeof user !== 'object') return [];
  const { rol } = user as GebruikerMetRol;
  if (rol === null || rol === undefined) return [];
  return Array.isArray(rol) ? rol : [rol];
}

export const isIngelogd: Access = ({ req }) => req.user !== null && req.user !== undefined;

export const isBeheerder: Access = ({ req }) => rollenVan(req.user).includes('beheerder');

/** Alleen de beheerder mag dit veld zien en wijzigen (bv. inkoopprijzen). */
export const isBeheerderVeld: FieldAccess = ({ req }) => rollenVan(req.user).includes('beheerder');

/** Laat door wie één van de opgegeven rollen heeft. */
export function heeftRol(...rollen: Rol[]): Access {
  return ({ req }) => rollenVan(req.user).some((rol) => rollen.includes(rol));
}

/**
 * Iedereen met een rol mag lezen, maar alleen de beheerder schrijft.
 * Voor de wettelijke referentielijsten (allergenen, btw-tarieven) die zelden wijzigen.
 */
export const alleenBeheerderSchrijft = {
  read: isIngelogd,
  create: isBeheerder,
  update: isBeheerder,
  delete: isBeheerder,
};

/** Iedereen met een rol mag lezen én bewerken — de dagelijkse catalogus. */
export const iedereenBewerkt = {
  read: isIngelogd,
  create: heeftRol('beheerder', 'keuken'),
  update: heeftRol('beheerder', 'keuken'),
  delete: isBeheerder,
};

/** Verkoop-gedreven collecties. */
export const verkoopToegang = {
  read: isIngelogd,
  create: heeftRol('beheerder', 'verkoop'),
  update: heeftRol('beheerder', 'verkoop'),
  delete: isBeheerder,
};

/** Logistiek-gedreven collecties. */
export const logistiekToegang = {
  read: isIngelogd,
  create: heeftRol('beheerder', 'logistiek', 'keuken'),
  update: heeftRol('beheerder', 'logistiek', 'keuken'),
  delete: isBeheerder,
};

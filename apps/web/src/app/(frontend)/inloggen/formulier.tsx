'use client';

import React, { useActionState, useState } from 'react';

import { inloggen, inloggenAlsGast, type InlogStand } from './acties';

/**
 * Het inlogformulier, naar het aangeleverde ontwerp.
 *
 * Twee manieren naar binnen: met een eigen account, of als gast. De gasttoegang maakt een
 * account met volledige rechten aan, zodat het systeem te bekijken is zonder dat er eerst
 * gebruikers aangemaakt hoeven te worden.
 */

const LEGE_STAND: InlogStand = {};

function Icoon({ d, maat = 24 }: { d: string; maat?: number }) {
  return (
    <svg width={maat} height={maat} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={d}
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const PADEN = {
  envelop: 'M3 5h18v14H3zM3 7l9 6 9-6',
  slot: 'M4 10h16v10H4zM7 10V7a5 5 0 0110 0v3',
  oog: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7zM12 15a3 3 0 100-6 3 3 0 000 6z',
  pijl: 'M9 6l6 6-6 6',
  persoon:
    'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4.4 3.6-8 8-8s8 3.6 8 8',
  waarschuwing: 'M12 3l9 17H3l9-17zM12 10v4M12 17h.01',
} as const;

export function InlogFormulier({ gastAan }: { gastAan: boolean }) {
  const [stand, actie, bezig] = useActionState<InlogStand, FormData>(inloggen, LEGE_STAND);
  const [gastStand, gastActie, gastBezig] = useActionState<InlogStand, FormData>(
    inloggenAlsGast,
    LEGE_STAND,
  );
  const [toonWachtwoord, zetToonWachtwoord] = useState(false);

  const fout = stand.fout ?? gastStand.fout;

  return (
    <form>
      {fout !== undefined && (
        <p className="lg-melding" role="alert">
          <Icoon d={PADEN.waarschuwing} maat={15} />
          <span>{fout}</span>
        </p>
      )}

      <div className="lg-field">
        <label htmlFor="email">Email address</label>
        <div className="lg-input-shell">
          <Icoon d={PADEN.envelop} />
          <input
            type="email"
            id="email"
            name="email"
            placeholder="naam@dekrimtexel.nl"
            autoComplete="username"
            required
          />
        </div>
      </div>

      <div className="lg-field">
        <label htmlFor="wachtwoord">Password</label>
        <div className="lg-input-shell">
          <Icoon d={PADEN.slot} />
          <input
            type={toonWachtwoord ? 'text' : 'password'}
            id="wachtwoord"
            name="wachtwoord"
            placeholder="Your password"
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            className="lg-toggle"
            onClick={() => zetToonWachtwoord((vorige) => !vorige)}
            aria-label={toonWachtwoord ? 'Hide password' : 'Show password'}
          >
            <Icoon d={PADEN.oog} maat={17} />
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="lg-btn-primary"
        formAction={actie}
        disabled={bezig}
        style={{ marginTop: 26 }}
      >
        {bezig ? 'WORKING…' : 'SIGN IN'}
        <Icoon d={PADEN.pijl} maat={14} />
      </button>

      {gastAan && (
        <>
          <div className="lg-divider">OR</div>

          <button
            type="submit"
            className="lg-btn-secondary"
            formAction={gastActie}
            disabled={gastBezig}
          >
            <Icoon d={PADEN.persoon} maat={17} />
            {gastBezig ? 'Starting guest access…' : 'Continue as guest'}
          </button>
        </>
      )}

      <div className="lg-form-legal">
        Guest access is meant for exploring the system and carries the same rights as an
        administrator. Turn it off before the system goes into real use.
      </div>
    </form>
  );
}

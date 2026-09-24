import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { getPayload } from 'payload';
import React from 'react';

import config from '@payload-config';

import { InlogFormulier } from './formulier';
import { gastToegangAan } from './gast';
import { INLOG_STIJL } from './stijl';

export const metadata: Metadata = {
  title: 'Inloggen — Foodbook',
  robots: { index: false, follow: false },
};

/**
 * Dit scherm moet bij elk verzoek worden opgebouwd, niet tijdens het bouwen.
 *
 * Het leest de sessie en start Payload. Payload heeft PAYLOAD_SECRET nodig, en dat bestaat niet
 * in de bouwfase van de Docker-image. Zonder deze regel probeert Next de pagina tijdens het
 * bouwen voor te bereiden en stopt de hele bouw met "missing secret key".
 */
export const dynamic = 'force-dynamic';

/** De fotostrook links. De uitsnede per kolom komt uit het ontwerp. */
const STROOK = [
  { bestand: 'col1.jpg', alt: 'Zoervlees in brood', stand: 'lg-mid' },
  { bestand: 'col2.jpg', alt: 'Brood, knoflook en druiven', stand: 'lg-down' },
  { bestand: 'col3.jpg', alt: 'Tomaten, brood en kruiden', stand: 'lg-up' },
  { bestand: 'col4.jpg', alt: 'Pruimen met roomkaas op cracker', stand: 'lg-mid' },
  { bestand: 'col5.jpg', alt: 'Vers gebakken brood', stand: 'lg-down' },
  { bestand: 'col6.jpg', alt: 'Kaasplank en charcuterie', stand: 'lg-up' },
] as const;

/**
 * Het inlogscherm van de Foodbook-portal.
 *
 * Vorm en verhoudingen komen uit foodbook-design/login.html. Dit scherm staat bewust buiten de
 * beheeromgeving van Payload: die tekent zijn eigen inlogpagina en is niet naar dit ontwerp te
 * krijgen. De sessie is wel dezelfde, dus na inloggen werken de rekenschermen en documenten.
 */
export default async function InlogPagina() {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await headers() });

  // Wie al ingelogd is hoeft dit scherm niet te zien.
  if (user !== null && user !== undefined) {
    redirect('/rekenen');
  }

  return (
    <div className="lg-screen">
      <style>{INLOG_STIJL}</style>

      {/* ── Beeldzijde ── */}
      <div className="lg-visual">
        <div className="lg-photo-strip">
          {STROOK.map((kolom) => (
            <div key={kolom.bestand} className={`lg-strip-col ${kolom.stand}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/login/${kolom.bestand}`} alt={kolom.alt} />
            </div>
          ))}
        </div>
        <div className="lg-strip-duotone" />
        <div className="lg-strip-grain" />
        <div className="lg-visual-vignette" />
        <div className="lg-visual-scrim" />

        <svg className="lg-lighthouse" viewBox="0 0 26 150" fill="none" aria-hidden="true">
          <rect x="9" y="34" width="8" height="98" fill="#fdfaf3" />
          <rect x="9" y="34" width="8" height="19" fill="#c0443a" />
          <rect x="9" y="72" width="8" height="19" fill="#c0443a" />
          <rect x="9" y="110" width="8" height="19" fill="#c0443a" />
          <polygon points="6,34 20,34 13,16" fill="#2b2b2b" />
          <rect x="4" y="132" width="18" height="10" fill="#2b2b2b" />
          <rect x="0" y="142" width="26" height="6" fill="#20281f" />
        </svg>

        <div className="lg-visual-topbar">
          <svg viewBox="0 0 32 18" fill="none" aria-hidden="true">
            <path
              d="M1 14C6 6 12 2 16 2C20 2 26 6 31 14"
              stroke="#fff"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </svg>
          <div className="lg-visual-brand">
            DE KRIM<span>TEXEL</span>
          </div>
        </div>

        <div className="lg-visual-copy">
          <div className="lg-eyebrow">
            <span>LOKAAL</span>
            <span>PUUR</span>
            <span>DUURZAAM</span>
            <span>GASTVRIJ</span>
          </div>
          <h1 className="lg-visual-title">Van ontbijt tot afterparty — alles op één plek.</h1>
          <p className="lg-visual-script">Echt Texel. Echt genieten.</p>
        </div>

        <div className="lg-visual-foot">
          <div className="lg-foot-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 3v8M6 3v8M4 11a2 2 0 004 0V3M8 3v18M18 3c-2 0-3 2-3 5s1 4 3 4v9" />
            </svg>
            325 gerechten
          </div>
          <div className="lg-foot-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M4 8h16l-1.5 12a2 2 0 01-2 1.8H7.5a2 2 0 01-2-1.8L4 8z" />
              <path d="M8 8a4 4 0 018 0" />
            </svg>
            48 lokale producenten
          </div>
          <div className="lg-foot-item">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 21s-8-5.2-8-11.5A4.5 4.5 0 0112 6a4.5 4.5 0 018 3.5C20 15.8 12 21 12 21z" />
            </svg>
            100% eilandgevoel
          </div>
        </div>
      </div>

      {/* ── Formulierzijde ── */}
      <div className="lg-form-side">
        <div className="lg-form-wrap">
          <div className="lg-form-eyebrow">FOODBOOK PORTAL</div>
          <h2 className="lg-form-title">Welkom terug</h2>
          <p className="lg-form-sub">
            Log in om verder te gaan met arrangementen, calculaties en het beheer van je Foodbook.
          </p>

          <InlogFormulier gastAan={gastToegangAan()} />
        </div>
      </div>
    </div>
  );
}

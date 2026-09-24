import Link from 'next/link';
import React from 'react';

import { NAVIGATIE, actiefItem, type NavItem } from './navigatie';
import { Pictogram } from './Pictogram';

/**
 * Het raamwerk van de beheeromgeving: zijbalk met navigatie, een dunne balk met de titel van
 * het huidige scherm, en het werkgebied.
 *
 * Dit is productgereedschap, geen presentatie. De chrome is daarom rustig: één donkere zijbalk,
 * één accentkleur, en hiërarchie uit gewicht en ruimte in plaats van uit kleur. De serif uit het
 * merkregister komt hier niet — die hoort bij de Foodbook-presentatie.
 */
export function AppShell({
  pad,
  titel,
  kruimel,
  acties,
  children,
}: {
  /** Het huidige pad, om de actieve navigatieregel te bepalen. */
  pad: string;
  titel: string;
  kruimel?: string;
  acties?: React.ReactNode;
  children: React.ReactNode;
}) {
  const actief = actiefItem(pad);

  return (
    <div className="kt-app">
      <a className="kt-overslaan" href="#werkgebied">
        Naar de inhoud
      </a>

      <Zijbalk actief={actief} />

      <div className="kt-hoofd">
        <header className="kt-balk">
          <div>
            <h1 className="kt-balk__titel">{titel}</h1>
            {kruimel !== undefined && <p className="kt-balk__kruimel">{kruimel}</p>}
          </div>
          {acties !== undefined && <div>{acties}</div>}
        </header>

        <main className="kt-inhoud" id="werkgebied">
          {children}
        </main>
      </div>
    </div>
  );
}

/** The wave mark from the brand lockup. */
function Merkteken({ maat = 30 }: { maat?: number }) {
  return (
    <svg viewBox="0 0 32 18" width={maat} height={Math.round(maat * 0.56)} fill="none" aria-hidden="true">
      <path
        d="M1 14C6 6 12 2 16 2C20 2 26 6 31 14"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function Zijbalk({ actief }: { actief: string | undefined }) {
  return (
    <nav className="kt-zijbalk" aria-label="Main navigation">
      <div className="kt-merk">
        <span className="kt-merk__teken">
          <Merkteken />
        </span>
        <Link className="kt-merk__naam" href="/">
          DE KRIM
        </Link>
        <span className="kt-merk__sub">TEXEL</span>
        <p className="kt-merk__belofte">From the island. For every occasion.</p>
      </div>

      <div className="kt-nav">
        {NAVIGATIE.map((groep) => (
          <div key={groep.titel}>
            <p className="kt-nav__kop">{groep.titel}</p>
            <ul className="kt-nav__lijst">
              {groep.items.map((item) => (
                <li key={item.label}>
                  <NavRegel item={item} actief={item.href !== undefined && item.href === actief} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <p className="kt-zijbalk__citaat">
        &ldquo;More than food. An island experience.&rdquo;
        <span className="kt-zijbalk__streep" aria-hidden="true" />
      </p>

      <div className="kt-zijbalk__voet">
        <Merkteken maat={26} />
        <span className="kt-zijbalk__voetnaam">DE KRIM</span>
        <span className="kt-zijbalk__voetsub">TEXEL</span>
      </div>
    </nav>
  );
}

function NavRegel({ item, actief }: { item: NavItem; actief: boolean }) {
  const inhoud = (
    <>
      <span className="kt-nav__icoon" aria-hidden="true">
        <Pictogram soort={item.icoon} />
      </span>
      <span>{item.label}</span>
      {item.href === undefined && <span className="kt-nav__volgt">volgt</span>}
    </>
  );

  // Nog niet gebouwde onderdelen krijgen geen link, zodat er geen dode navigatie ontstaat.
  if (item.href === undefined) {
    return (
      <span className="kt-nav__link kt-nav__link--volgt" title={item.toelichting}>
        {inhoud}
      </span>
    );
  }

  return (
    <Link
      className="kt-nav__link"
      href={item.href}
      aria-current={actief ? 'page' : undefined}
      title={item.toelichting}
    >
      {inhoud}
    </Link>
  );
}

/** Eenvoudige lijnpictogrammen — de gedeelde stijl uit ./Pictogram. */

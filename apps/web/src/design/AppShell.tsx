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

function Zijbalk({ actief }: { actief: string | undefined }) {
  return (
    <nav className="kt-zijbalk" aria-label="Hoofdnavigatie">
      <div className="kt-merk">
        <Link className="kt-merk__naam" href="/rekenen">
          De Krim Texel
        </Link>
        <p className="kt-merk__belofte">Van het eiland. Voor ieder moment.</p>
      </div>

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

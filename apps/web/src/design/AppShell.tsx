import Link from 'next/link';
import React from 'react';

import { NAVIGATIE, actiefItem, type NavItem } from './navigatie';

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

/** Eenvoudige lijnpictogrammen, één stijl: 16×16, geen vulling. */
function Pictogram({ soort }: { soort: NavItem['icoon'] }) {
  const paden: Record<NavItem['icoon'], string> = {
    bord: 'M2 9h12M4 9V7h8v2M3 12h10',
    boek: 'M3 3h7a2 2 0 012 2v8H5a2 2 0 01-2-2V3zM12 5h1a2 2 0 012 2v6',
    recept: 'M4 2h8v12H4zM6 5h4M6 8h4M6 11h2',
    mand: 'M2 6h12l-1.5 7h-9L2 6zM5 6a3 3 0 016 0',
    doos: 'M2 5l6-3 6 3v6l-6 3-6-3V5zM2 5l6 3 6-3M8 8v6',
    allergeen: 'M8 2l6 3.5v5L8 14l-6-3.5v-5L8 2zM8 6v3M8 11h.01',
    klant: 'M8 7a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM3 14c0-2.5 2.2-4 5-4s5 1.5 5 4',
    agenda: 'M3 3h10v11H3zM3 6h10M6 2v2M10 2v2',
    rekenmachine: 'M4 2h8v12H4zM6 5h4M6 8h1M9 8h1M6 11h1M9 11h1',
    wagen: 'M1 4h9v7H1zM10 6h3l2 2v3h-5M4 13a1 1 0 100-2 1 1 0 000 2zM12 13a1 1 0 100-2 1 1 0 000 2z',
    pan: 'M3 8h10v3a3 3 0 01-3 3H6a3 3 0 01-3-3V8zM13 9h2M5 5V3M8 5V3',
    factuur: 'M4 2h8v12H4zM6 5h4M6 8h4M6 11h2',
    grafiek: 'M2 13h12M4 13V8M7 13V5M10 13V9',
    tandwiel: 'M8 10a2 2 0 100-4 2 2 0 000 4zM8 2v2M8 12v2M2 8h2M12 8h2M4 4l1.5 1.5M10.5 10.5L12 12M12 4l-1.5 1.5M5.5 10.5L4 12',
  };

  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d={paden[soort]}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

import React from 'react';

/**
 * Eén pictogramstijl voor de hele beheeromgeving.
 *
 * Alle iconen zijn 16×16, getekend met lijnen en zonder vulling. Ze nemen de kleur van de tekst
 * over via `currentColor`, zodat ze automatisch meelopen met de actieve toestand en met het
 * kleurenschema. Er is bewust geen tweede stijl naast: één vormtaal, overal hetzelfde.
 *
 * Twee manieren van gebruiken:
 *   <Pictogram soort="recept" />            — een van de vaste namen hieronder
 *   <Pictogram d="M8 2v8M5 7l3 3 3-3" />    — een eigen pad, in dezelfde stijl
 */

const PADEN = {
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
  tandwiel:
    'M8 10a2 2 0 100-4 2 2 0 000 4zM8 2v2M8 12v2M2 8h2M12 8h2M4 4l1.5 1.5M10.5 10.5L12 12M12 4l-1.5 1.5M5.5 10.5L4 12',

  /** Downloaden: pijl naar beneden in een bak. */
  download: 'M8 2v8M5 7l3 3 3-3M3 13h10',
  /** Terug: pijl naar links. */
  terug: 'M10 3L5 8l5 5M5 8h9',
} as const;

export type PictogramNaam = keyof typeof PADEN;

export function Pictogram({
  soort,
  d,
  maat = 16,
}: {
  soort?: PictogramNaam;
  d?: string;
  maat?: number;
}) {
  const pad = d ?? (soort !== undefined ? PADEN[soort] : undefined);

  if (pad === undefined) {
    throw new Error('Pictogram: geef een `soort` of een `d` mee.');
  }

  return (
    <svg width={maat} height={maat} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d={pad}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

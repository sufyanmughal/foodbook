import { Document, documentStijl } from '@foodbook/documents/templates';
import { DocumentFout } from '@foodbook/documents';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import React from 'react';

import { eisIngelogdeGebruiker } from '@/diensten/auth';
import { Pictogram } from '@/design/Pictogram';
import {
  EVENEMENT_DOCUMENTEN,
  maakDocumentVoorEvenement,
  naarMerkgegevens,
  type EvenementDocumentType,
} from '@/diensten/documenten';

export const dynamic = 'force-dynamic';

type Args = {
  params: Promise<{ type: string; evenement: string }>;
};

function isGeldigType(type: string): type is EvenementDocumentType {
  return (EVENEMENT_DOCUMENTEN as readonly string[]).includes(type);
}

export const metadata: Metadata = {
  title: 'Document — Foodbook',
  robots: { index: false, follow: false },
};

/**
 * Toont een document als printbare pagina.
 *
 * Er wordt hier bewust hetzelfde React-sjabloon gerenderd als waarmee de PDF gemaakt wordt, in
 * plaats van kant-en-klare HTML in te voegen. Zo is er één sjabloon, en komt er geen volledige
 * HTML-pagina binnen de body van de applicatie terecht.
 */
export default async function DocumentPagina({ params }: Args) {
  const { type, evenement } = await params;
  const { payload } = await eisIngelogdeGebruiker();

  if (!isGeldigType(type)) notFound();

  let model;
  try {
    model = await maakDocumentVoorEvenement(payload, type, evenement);
  } catch (fout) {
    // Een ontbrekende offerte is geen programmeerfout maar een toestand: laat dat zien met een
    // begrijpelijke pagina in plaats van een serverfout.
    if (fout instanceof DocumentFout) {
      return (
        <main style={{ fontFamily: 'var(--kt-sans)', margin: '0 auto', maxWidth: 640, padding: 48 }}>
          <h1 style={{ fontSize: 22 }}>Dit document kan nog niet gemaakt worden</h1>
          <p>{fout.message}</p>
          <a
            href={`/rekenen?evenement=${evenement}`}
            style={{
              alignItems: 'center',
              color: 'var(--kt-teal-600)',
              display: 'inline-flex',
              gap: 'var(--kt-2)',
            }}
          >
            <Pictogram soort="terug" />
            Terug naar het rekenscherm
          </a>
        </main>
      );
    }
    throw fout;
  }

  const bedrijfRuw = await payload.findGlobal({
    slug: 'bedrijfsinstellingen',
    depth: 1,
    overrideAccess: true,
  });

  return (
    <>
      <style>{documentStijl + WERKBALK_STIJL}</style>

      <div className="fb-werkbalk">
        <a href={`/documenten/${type}/${evenement}/pdf`} className="fb-werkbalk__knop">
          <Pictogram soort="download" />
          Downloaden als PDF
        </a>
        <a href={`/rekenen?evenement=${evenement}`} className="fb-werkbalk__knop">
          <Pictogram soort="terug" />
          Terug naar rekenen
        </a>
        <span className="fb-werkbalk__titel">{model.titel}</span>
      </div>

      <Document model={model} merk={naarMerkgegevens(bedrijfRuw as never)} />
    </>
  );
}

const WERKBALK_STIJL = `
.fb-werkbalk {
  align-items: center;
  background: var(--kt-papier);
  border-bottom: 1px solid var(--kt-rand);
  display: flex;
  font-family: var(--kt-sans);
  font-size: 14px;
  gap: var(--kt-4);
  padding: var(--kt-3) var(--kt-4);
}
.fb-werkbalk__knop {
  align-items: center;
  color: var(--kt-teal-600);
  display: inline-flex;
  gap: var(--kt-2);
  text-decoration: none;
}
.fb-werkbalk__knop:hover { color: var(--kt-teal-500); text-decoration: underline; }
.fb-werkbalk__knop svg { flex: none; }
.fb-werkbalk__titel { color: var(--kt-tekst-gedempt); margin-left: auto; }
@media print {
  /* De werkbalk hoort niet op papier. */
  .fb-werkbalk { display: none !important; }
}
`;

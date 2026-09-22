import { Document, documentStijl } from '@foodbook/documents/templates';
import { DocumentFout } from '@foodbook/documents';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import React from 'react';

import { eisIngelogdeGebruiker } from '@/diensten/auth';
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
        <main style={{ fontFamily: 'system-ui, sans-serif', margin: '0 auto', maxWidth: 640, padding: 48 }}>
          <h1 style={{ fontSize: 22 }}>Dit document kan nog niet gemaakt worden</h1>
          <p>{fout.message}</p>
          <a href={`/rekenen?evenement=${evenement}`} style={{ color: '#1f6f4a' }}>
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
          Downloaden als PDF
        </a>
        <a href={`/rekenen?evenement=${evenement}`} className="fb-werkbalk__knop">
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
  background: #f2f2f2;
  border-bottom: 1px solid #ddd;
  display: flex;
  font-family: "Segoe UI", system-ui, sans-serif;
  font-size: 14px;
  gap: 16px;
  padding: 10px 16px;
}
.fb-werkbalk__knop { color: #1f6f4a; text-decoration: none; }
.fb-werkbalk__knop:hover { text-decoration: underline; }
.fb-werkbalk__titel { color: #777; margin-left: auto; }
@media print {
  /* De werkbalk hoort niet op papier. */
  .fb-werkbalk { display: none !important; }
}
`;

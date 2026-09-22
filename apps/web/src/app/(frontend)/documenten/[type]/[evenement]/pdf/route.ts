import type { NextRequest } from 'next/server';

import { eisIngelogdeGebruiker } from '@/diensten/auth';
import { EVENEMENT_DOCUMENTEN, type EvenementDocumentType } from '@/diensten/documenten';
import { maakPdf, PdfFout } from '@/diensten/pdf';

export const dynamic = 'force-dynamic';

function isGeldigType(type: string): type is EvenementDocumentType {
  return (EVENEMENT_DOCUMENTEN as readonly string[]).includes(type);
}

/**
 * Levert het document als PDF.
 *
 * De HTML wordt **niet** hier opgebouwd, maar opgehaald bij de documentpagina zelf. Reden:
 * Next staat het gebruik van `react-dom/server` in de app-router niet toe, en zo blijft er
 * bovendien één renderer in plaats van twee die uit elkaar kunnen lopen. Wat je op het scherm
 * ziet is dus letterlijk wat er in de PDF komt.
 *
 * De sessiecookie wordt doorgegeven, zodat de interne aanroep dezelfde rechten heeft als de
 * gebruiker die het opvraagt.
 */
export async function GET(
  verzoek: NextRequest,
  { params }: { params: Promise<{ type: string; evenement: string }> },
) {
  const { type, evenement } = await params;

  try {
    await eisIngelogdeGebruiker();

    if (!isGeldigType(type)) {
      return new Response('Onbekend documenttype', { status: 404 });
    }

    const paginaUrl = new URL(`/documenten/${type}/${evenement}`, verzoek.nextUrl.origin);

    const pagina = await fetch(paginaUrl, {
      headers: {
        cookie: verzoek.headers.get('cookie') ?? '',
        // Voorkomt dat Next een gecachte versie teruggeeft.
        'cache-control': 'no-store',
      },
      cache: 'no-store',
    });

    if (!pagina.ok) {
      return new Response(`Kon het document niet opbouwen (${pagina.status}).`, {
        status: pagina.status,
      });
    }

    const pdf = await maakPdf(await pagina.text());
    const bestandsnaam = `${type}-${evenement}.pdf`;

    return new Response(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${bestandsnaam}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (fout) {
    if (fout instanceof PdfFout) {
      return new Response(fout.message, { status: 503 });
    }

    const bericht = fout instanceof Error ? fout.message : 'Onbekende fout';
    return new Response(`Kon het document niet maken: ${bericht}`, { status: 500 });
  }
}

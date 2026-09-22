import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { DocumentModel } from '../model';
import { Document, type Merkgegevens } from './Document';
import { documentStijl } from './stijl';

/**
 * Rendert een documentmodel naar HTML.
 *
 * Dit is de brug naar alles wat geen React is: de PDF-renderer en de e-mailbijlage. Omdat React
 * tekst automatisch escapet, is dit ook de plek waar klant- en productnamen veilig in een
 * document terechtkomen.
 *
 * Bewust in een **eigen bestand**, los van het component zelf. Next staat niet toe dat een
 * component `react-dom/server` meeneemt de app in, dus een scherm dat alleen het sjabloon wil
 * tonen mag hier niet van afhankelijk zijn. Deze module wordt daarom alleen gebruikt op plekken
 * die puur server-side zijn, zoals een route handler.
 *
 * Er wordt `createElement` gebruikt in plaats van JSX, zodat dit bestand niet afhankelijk is van
 * de JSX-instelling van de toolchain die het toevallig transpileert.
 */
export function naarHtmlFragment(model: DocumentModel, merk?: Merkgegevens): string {
  return renderToStaticMarkup(createElement(Document, { model, merk }));
}

/** Een volledig, zelfstandig HTML-document — klaar om te printen of naar PDF te renderen. */
export function naarHtmlDocument(model: DocumentModel, merk?: Merkgegevens): string {
  return [
    '<!DOCTYPE html>',
    '<html lang="nl">',
    '<head>',
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${escapeHtml(model.titel)}</title>`,
    `<style>${documentStijl}</style>`,
    '</head>',
    '<body>',
    naarHtmlFragment(model, merk),
    '</body>',
    '</html>',
  ].join('\n');
}

function escapeHtml(waarde: string): string {
  return waarde
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

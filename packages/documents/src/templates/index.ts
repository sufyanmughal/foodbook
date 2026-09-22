/**
 * Het documentsjabloon voor gebruik **binnen de applicatie**.
 *
 * Deze ingang bevat bewust géén `naarHtmlDocument`: dat rendert naar een HTML-string en gebruikt
 * daarvoor `react-dom/server`, wat Next niet toestaat in de app-router. Schermen die het
 * sjabloon tonen importeren daarom alleen dit bestand. Wie een volledig HTML-document nodig
 * heeft (de PDF-renderer, de e-mailsjabloon, losse scripts) gebruikt
 * `@foodbook/documents/templates/html`.
 */
export { Document, type Merkgegevens } from './Document';
export { documentStijl } from './stijl';

import { existsSync } from 'node:fs';
import puppeteer, { type Browser } from 'puppeteer-core';

/**
 * PDF-rendering (§5).
 *
 * De HTML uit `@foodbook/documents/templates` wordt met de browser die al op de machine staat
 * naar PDF gerenderd. Bewust geen meegebundelde Chromium: ARCHITECTURE.md §2 kiest Tauri juist
 * omdat het een kleine binary oplevert. Zie BESLISSINGEN.md B11.
 *
 * ## Waarom hier een wachtrij staat
 *
 * Chromium gebruikt honderden megabytes per pagina, en op een kleine server is geheugen de
 * schaarste, niet de processor. Zonder begrenzing zouden twee gelijktijdige documenten twee
 * browsers starten en de server omver duwen. Het falen is dan een document dat niet gemaakt
 * wordt, zonder duidelijke oorzaak.
 *
 * Daarom:
 * 1. **Één browser, hergebruikt.** Dat scheelt ook ongeveer een seconde opstarttijd per document.
 * 2. **Één document tegelijk.** Aanvragen staan in de rij in plaats van naast elkaar.
 * 3. **De browser sluit na een rustperiode**, zodat hij in een stil uur geen geheugen vasthoudt.
 * 4. **Een bovengrens op de rij**, zodat een piek niet onbeperkt groeit maar een begrijpelijke
 *    melding geeft.
 *
 * De oriëntatie zit in de HTML zelf, via de `@page`-regel; daarom wordt `preferCSSPageSize`
 * gebruikt en hoeft de aanroeper zich daar niet mee te bemoeien.
 */

const BROWSERKANDIDATEN = [
  process.env.CHROME_PAD,
  // Linux (de Docker-image op de server)
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  // Windows (de desktopversie)
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].filter((pad): pad is string => typeof pad === 'string');

/** Hoe lang de browser blijft staan nadat het laatste document klaar is. */
const RUSTTIJD_MS = 2 * 60 * 1000;

/**
 * Hoeveel aanvragen er mogen wachten voordat we er één vriendelijk weigeren.
 *
 * Ruim genoeg dat een team dat een paar documenten tegelijk opent nooit wordt geweigerd, maar
 * begrensd zodat een piek het geheugen niet onbeperkt laat groeien. Bij ongeveer twee seconden
 * per document is dit in het slechtste geval een halve minuut wachten.
 */
const MAX_IN_DE_RIJ = 10;

export class PdfFout extends Error {
  override readonly name = 'PdfFout';
}

/** Pad naar de browser die gebruikt wordt, of undefined als er geen gevonden is. */
export function vindBrowser(): string | undefined {
  return BROWSERKANDIDATEN.find((pad) => existsSync(pad));
}

let browser: Browser | undefined;
let sluitTimer: NodeJS.Timeout | undefined;
let rij: Promise<unknown> = Promise.resolve();
let inDeRij = 0;
/** Alleen voor diagnostiek: hoeveel documenten er in dit proces gemaakt zijn. */
let gemaakt = 0;

/**
 * Zet taken achter elkaar in plaats van naast elkaar.
 *
 * Weigert wanneer er te veel aanvragen staan: op een kleine server is wachten beter dan
 * omvallen, maar onbeperkt wachten is erger dan een duidelijke melding.
 */
export function inDeWachtrij<T>(taak: () => Promise<T>): Promise<T> {
  if (inDeRij >= MAX_IN_DE_RIJ) {
    return Promise.reject(
      new PdfFout(
        'Er worden op dit moment veel documenten gemaakt. Probeer het over een moment opnieuw.',
      ),
    );
  }

  inDeRij += 1;
  const resultaat = rij.then(taak, taak).finally(() => {
    inDeRij -= 1;
  });

  // De rij mag niet breken op een fout; de volgende aanvraag moet gewoon door kunnen.
  rij = resultaat.then(
    () => undefined,
    () => undefined,
  );

  return resultaat;
}

async function pakBrowser(): Promise<Browser> {
  if (sluitTimer !== undefined) {
    clearTimeout(sluitTimer);
    sluitTimer = undefined;
  }

  if (browser !== undefined && browser.connected) return browser;

  const pad = vindBrowser();
  if (pad === undefined) {
    throw new PdfFout(
      'Geen browser gevonden om PDF’s te maken. Installeer Chromium, of wijs met CHROME_PAD naar een bestaande Chrome of Edge.',
    );
  }

  browser = await puppeteer.launch({
    executablePath: pad,
    headless: true,
    // In een container draait het proces als root; Chromium weigert dan zonder deze vlag.
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'],
  });

  return browser;
}

/** Sluit de browser zodra er een tijdje niets te doen is, zodat hij geen geheugen bezet houdt. */
function planSluiten(): void {
  if (sluitTimer !== undefined) clearTimeout(sluitTimer);

  sluitTimer = setTimeout(() => {
    sluitTimer = undefined;
    const teSluiten = browser;
    browser = undefined;
    void teSluiten?.close().catch(() => undefined);
  }, RUSTTIJD_MS);

  // Een timer mag het afsluiten van het proces niet tegenhouden.
  sluitTimer.unref();
}

/**
 * Rendert een volledig HTML-document naar PDF.
 *
 * Gooit een `PdfFout` met een begrijpelijke melding als er geen browser op de machine staat.
 */
export function maakPdf(html: string): Promise<Buffer> {
  return inDeWachtrij(async () => {
    const actieveBrowser = await pakBrowser();

    try {
      const page = await actieveBrowser.newPage();
      try {
        // `load` is genoeg: de opmaak zit inline in de HTML, er zijn geen externe bestanden.
        await page.setContent(html, { waitUntil: 'load' });
        const pdf = await page.pdf({ printBackground: true, preferCSSPageSize: true });
        gemaakt += 1;
        return Buffer.from(pdf);
      } finally {
        await page.close().catch(() => undefined);
      }
    } finally {
      planSluiten();
    }
  });
}

/** Diagnostiek: hoeveel browsers staan er nu, en hoeveel documenten zijn er gemaakt? */
export function pdfStatus(): { browserActief: boolean; inDeRij: number; gemaakt: number } {
  return {
    browserActief: browser !== undefined && browser.connected,
    inDeRij,
    gemaakt,
  };
}

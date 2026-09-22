/**
 * Maakt schermafbeeldingen van de voorbeelddocumenten, zodat de opmaak visueel te
 * controleren is zonder PDF-lezer. Handig als rooktest na wijzigingen aan het sjabloon.
 *
 * Uitvoeren:  npx tsx scripts/screenshot-voorbeelddocumenten.mts
 * Uitvoer:    voorbeelddocumenten/*.png
 */

import { existsSync } from 'node:fs';
import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import puppeteer from 'puppeteer-core';

const UIT = resolve(process.cwd(), 'voorbeelddocumenten');

const BROWSERKANDIDATEN = [
  process.env.CHROME_PAD,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].filter((pad): pad is string => typeof pad === 'string');

const browserPad = BROWSERKANDIDATEN.find((pad) => existsSync(pad));
if (browserPad === undefined) {
  console.error('Geen Edge of Chrome gevonden.');
  process.exit(1);
}

const htmlBestanden = readdirSync(UIT).filter((naam) => naam.endsWith('.html'));

const browser = await puppeteer.launch({
  executablePath: browserPad,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});

try {
  for (const naam of htmlBestanden) {
    const page = await browser.newPage();
    await page.setViewport({ width: 900, height: 1400, deviceScaleFactor: 1.5 });
    await page.goto(`file:///${resolve(UIT, naam).replace(/\\/g, '/')}`, { waitUntil: 'load' });
    const png = resolve(UIT, `${naam.replace(/\.html$/, '')}.png`);
    await page.screenshot({ path: png, fullPage: true });
    await page.close();
    console.log(`  ${png}`);
  }
} finally {
  await browser.close();
}

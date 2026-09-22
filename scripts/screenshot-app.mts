/**
 * Maakt een schermafbeelding van een draaiende applicatie, om snel visueel te controleren of
 * een pagina klopt. Handig tijdens het bouwen en bij het opleveren.
 *
 * Uitvoeren:  npx tsx scripts/screenshot-app.mts <url> [uitvoerbestand]
 * Voorbeeld:  npx tsx scripts/screenshot-app.mts http://localhost:3000/admin/login
 */

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import puppeteer from 'puppeteer-core';

const BROWSERKANDIDATEN = [
  process.env.CHROME_PAD,
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
].filter((pad): pad is string => typeof pad === 'string');

const url = process.argv[2];
if (url === undefined) {
  console.error('Gebruik: npx tsx scripts/screenshot-app.mts <url> [uitvoerbestand]');
  process.exit(1);
}

const browserPad = BROWSERKANDIDATEN.find((pad) => existsSync(pad));
if (browserPad === undefined) {
  console.error('Geen Edge of Chrome gevonden.');
  process.exit(1);
}

const naam = url.replace(/^https?:\/\//, '').replace(/[^a-zA-Z0-9]+/g, '-').replace(/-+$/, '');
const uitvoer = resolve(process.cwd(), process.argv[3] ?? `voorbeelddocumenten/app-${naam}.png`);

const browser = await puppeteer.launch({
  executablePath: browserPad,
  headless: true,
  args: ['--no-sandbox', '--disable-gpu'],
});

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 1.25 });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 120_000 });
  await new Promise((klaar) => setTimeout(klaar, 1500));
  await page.screenshot({ path: uitvoer });
  console.log(`  ${uitvoer}`);
} finally {
  await browser.close();
}

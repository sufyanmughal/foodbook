/**
 * De opmaak van alle documenten — één standaard voor alles.
 *
 * ## De standaard
 *
 * | | |
 * |---|---|
 * | Papier | **A4 staand** (210 × 297 mm) — voor élk document, zonder uitzonderingen |
 * | Marge | **14 mm** rondom |
 * | Tekstbreedte | **182 mm** (210 − 2 × 14) |
 * | Basistekst | 10,5 pt |
 *
 * ## Scherm is gelijk aan papier
 *
 * De schermweergave is een voorstelling van een vel papier: dezelfde 210 mm breed, dezelfde 14 mm
 * witrand, dezelfde tekstbreedte. Het enige verschil is de schaduw en de grijze achtergrond
 * eromheen, die alleen op het scherm staan.
 *
 * Dat gebeurt door de marge op twee plekken identiek te zetten:
 * - op het scherm als `padding` op het document (`14mm`),
 * - op papier als `@page { margin: 14mm }`, met het document zelf op `padding: 0`.
 *
 * Beide geven een tekstbreedte van 182 mm, dus wat je op het scherm ziet is wat er uit de printer
 * komt.
 */
export const documentStijl = `
/* ── Het vel ──────────────────────────────────────────────────────────────── */

.fb-document {
  /* Eén bron voor de paginamaat: alles wat van de breedte afhangt verwijst hiernaar. */
  --fb-pagina-breedte: 210mm;
  --fb-pagina-marge: 14mm;

  --fb-primair: #2f6564;
  --fb-secundair: #c5a55a;
  --fb-tekst: #1a1a1a;
  --fb-gedempt: #5c5c5c;
  --fb-rand: #d6d6d6;
  --fb-kop-achtergrond: #f4f6f4;

  background: #ffffff;
  box-sizing: border-box;
  color: var(--fb-tekst);
  font-family: "Segoe UI", system-ui, -apple-system, Helvetica, Arial, sans-serif;
  font-size: 10.5pt;
  line-height: 1.45;
  margin: 0 auto;
  padding: var(--fb-pagina-marge);
  width: var(--fb-pagina-breedte);
}

.fb-document *,
.fb-document *::before,
.fb-document *::after {
  box-sizing: border-box;
}

/* Op het scherm staat het vel op een grijze ondergrond met een schaduw, zodat zichtbaar is waar
   de pagina ophoudt. Op papier verdwijnt dat allemaal. */
@media screen {
  body:has(.fb-document) {
    background: #eceff1;
    margin: 0;
    padding: 24px 0;
  }

  .fb-document {
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.16), 0 6px 20px rgba(0, 0, 0, 0.08);
    min-height: 297mm;
  }
}

/* ── Kop ──────────────────────────────────────────────────────────────────── */

.fb-kop {
  align-items: flex-start;
  border-bottom: 2px solid var(--fb-primair);
  display: flex;
  gap: 10mm;
  justify-content: space-between;
  padding-bottom: 4mm;
}

.fb-kop__merk {
  display: block;
  margin-bottom: 2mm;
  max-height: 16mm;
  max-width: 55mm;
  object-fit: contain;
}

.fb-titel {
  color: var(--fb-primair);
  font-size: 19pt;
  line-height: 1.15;
  margin: 0;
}

.fb-ondertitel {
  color: var(--fb-gedempt);
  font-size: 10.5pt;
  margin: 1mm 0 0;
}

.fb-meta {
  border-collapse: collapse;
  flex: 0 0 auto;
  margin: 0;
}

.fb-meta th,
.fb-meta td {
  font-size: 9.5pt;
  padding: 0.6mm 0;
  text-align: right;
  vertical-align: top;
}

.fb-meta th {
  color: var(--fb-gedempt);
  font-weight: 500;
  padding-right: 4mm;
}

.fb-meta td {
  font-weight: 600;
  white-space: nowrap;
}

/* ── Adres- en gegevensblokken ────────────────────────────────────────────── */

.fb-blokken {
  display: flex;
  flex-wrap: wrap;
  gap: 8mm;
  margin: 6mm 0 0;
}

.fb-blok {
  flex: 1 1 52mm;
  min-width: 48mm;
}

.fb-blok__titel {
  color: var(--fb-gedempt);
  font-size: 8.5pt;
  font-weight: 600;
  letter-spacing: 0.04em;
  margin: 0 0 1.5mm;
  text-transform: uppercase;
}

.fb-blok__regels {
  list-style: none;
  margin: 0;
  padding: 0;
}

.fb-blok__regels li {
  margin: 0;
  overflow-wrap: anywhere;
}

/* ── Secties en tabellen ──────────────────────────────────────────────────── */

.fb-sectie {
  margin-top: 7mm;
}

.fb-sectie__titel {
  background: var(--fb-kop-achtergrond);
  border-left: 3px solid var(--fb-primair);
  font-size: 10pt;
  font-weight: 600;
  margin: 0 0 2mm;
  padding: 1.5mm 3mm;
}

.fb-tabel {
  border-collapse: collapse;
  table-layout: fixed;
  width: 100%;
}

.fb-tabel thead th {
  border-bottom: 1px solid var(--fb-primair);
  color: var(--fb-gedempt);
  font-size: 8.5pt;
  font-weight: 600;
  letter-spacing: 0.03em;
  overflow-wrap: anywhere;
  padding: 1.5mm 2mm;
  text-align: left;
  text-transform: uppercase;
  vertical-align: bottom;
}

.fb-tabel tbody td {
  border-bottom: 1px solid var(--fb-rand);
  overflow-wrap: anywhere;
  padding: 1.6mm 2mm;
  vertical-align: top;
}

/* Getalkolommen rechts uitlijnen; de eerste kolom is de omschrijving en blijft links. */
.fb-tabel tbody td:not(:first-child),
.fb-tabel thead th:not(:first-child) {
  text-align: right;
}

.fb-tabel tbody tr.fb-rij--nadruk td {
  font-weight: 600;
}

.fb-rij--afvinkbaar td:last-child {
  font-size: 13pt;
  text-align: center;
}

/* De allergenenmatrix: alle kolommen behalve de eerste bevatten alleen een X of niets, dus die
   horen gecentreerd — ook de kolomkoppen, want dat zijn gerechtnamen en geen getallen. */
.fb-tabel--matrix thead th:nth-child(n + 2),
.fb-tabel--matrix tbody td:nth-child(n + 2) {
  text-align: center;
}

/* ── Totalen ──────────────────────────────────────────────────────────────── */

.fb-totalen {
  border-collapse: collapse;
  margin: 6mm 0 0 auto;
  width: 78mm;
}

.fb-totalen th,
.fb-totalen td {
  padding: 1.2mm 0;
  text-align: right;
}

.fb-totalen th {
  color: var(--fb-gedempt);
  font-weight: 500;
  padding-right: 6mm;
}

.fb-totalen tr.fb-totaal--nadruk th,
.fb-totalen tr.fb-totaal--nadruk td {
  border-top: 2px solid var(--fb-primair);
  color: var(--fb-primair);
  font-size: 12pt;
  font-weight: 700;
  padding-top: 2mm;
}

/* ── Voettekst ────────────────────────────────────────────────────────────── */

.fb-voettekst {
  border-top: 1px solid var(--fb-rand);
  color: var(--fb-gedempt);
  font-size: 8.5pt;
  margin-top: 9mm;
  padding-top: 2.5mm;
}

/* ── Paginagedrag ─────────────────────────────────────────────────────────── */

.fb-rij,
.fb-blok,
.fb-totalen,
.fb-kop {
  break-inside: avoid;
  page-break-inside: avoid;
}

.fb-sectie__titel {
  break-after: avoid;
  page-break-after: avoid;
}

.fb-tabel thead {
  display: table-header-group; /* kolomkoppen herhalen op elke pagina */
}

.fb-tabel tr {
  break-inside: avoid;
  page-break-inside: avoid;
}

/* ── Papier ───────────────────────────────────────────────────────────────── */

@page {
  size: A4 portrait;
  margin: 14mm;
}

@media print {
  html,
  body {
    background: #ffffff;
    margin: 0;
    padding: 0;
  }

  /* De marge komt op papier van @page, dus het document zelf zet hem op nul. Samen geven ze
     dezelfde 14 mm als op het scherm — daar zit de padding. */
  .fb-document {
    box-shadow: none;
    margin: 0;
    min-height: 0;
    padding: 0;
    width: auto;
  }

  .fb-document a {
    color: inherit;
    text-decoration: none;
  }
}
`;

import { productenZonderAllergenenInfo } from '@foodbook/calculation-engine';
import { formatteerBedrag, formatteerDatum, formatteerHoeveelheid, t } from '@foodbook/i18n';
import type { Product } from '@foodbook/shared-types';
import type { Metadata } from 'next';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import React from 'react';

import { AppShell } from '@/design/AppShell';
import { eisIngelogdeGebruiker } from '@/diensten/auth';
import { EVENEMENT_DOCUMENTEN, haalNieuwsteOfferte } from '@/diensten/documenten';
import { naarPayloadId } from '@/diensten/ids';
import { berekenEvenement, genereerOfferte } from '@/diensten/keten';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Dashboard — De Krim Texel' };

const DOCUMENT_LABELS: Record<(typeof EVENEMENT_DOCUMENTEN)[number], string> = {
  offerte: t('documenten.offerte'),
  productielijst: t('documenten.productielijst'),
  keukenlijst: t('documenten.keukenlijst'),
  inkooplijst: t('documenten.inkooplijst'),
  materialenlijst: t('documenten.materialenlijst'),
  paklijst: t('documenten.paklijst'),
  allergenenlijst: t('documenten.allergenenlijst'),
};

/**
 * Het rekenscherm.
 *
 * Toont wat het systeem voor dit evenement berekent: ingrediëntbehoefte, inkoop, materialen,
 * offerte en marge, en biedt per document een knop om het te bekijken of als PDF op te slaan.
 * Wat je hier ziet is exact wat er in de documenten terechtkomt — beide komen uit dezelfde
 * rekenmotor.
 */
export default async function RekenenPagina({
  searchParams,
}: {
  searchParams: Promise<{ evenement?: string }>;
}) {
  const { payload, gebruiker } = await eisIngelogdeGebruiker();
  const params = await searchParams;

  const evenementen = await payload.find({
    collection: 'evenementen',
    sort: '-datum',
    limit: 100,
    depth: 1,
    overrideAccess: true,
  });

  if (evenementen.docs.length === 0) {
    return (
      <AppShell pad="/rekenen" titel="Dashboard" kruimel={gebruiker.naam ?? gebruiker.email ?? ''}>
        <div className="kt-paneel">
          <h2 className="kt-paneel__titel">Nog geen evenement</h2>
          <p className="kt-paneel__uitleg">
            Maak eerst een evenement aan bij{' '}
            <Link href="/admin/collections/evenementen">Evenementen</Link>, met een klant, een datum
            en het aantal gasten.
          </p>
        </div>
      </AppShell>
    );
  }

  const gekozenId = String(params.evenement ?? evenementen.docs[0]?.id ?? '');
  const resultaat = await berekenEvenement(payload, gekozenId);
  const { evenement, productie, inkoop, offerte, allergenenPerProduct, materialen } = resultaat;
  const opgeslagenOfferte = await haalNieuwsteOfferte(payload, gekozenId);

  // B15 — gerechten waarvan geen allergenen bekend zijn. Dit mag nooit stilzwijgend als
  // "allergeenvrij" gelezen worden, dus het staat zichtbaar op dit scherm.
  const onbekendeAllergenen = productenZonderAllergenenInfo(
    [...new Set(evenement.producten.map((regel) => regel.product))]
      .map((id) => resultaat.context.dataset.producten[id])
      .filter((product): product is Product => product !== undefined),
  );

  /** Past het aantal gasten aan. Daarna rekent alles opnieuw — dat is de kern van het systeem. */
  async function wijzigGasten(formulierGegevens: FormData) {
    'use server';
    const nieuweWaarde = Number(formulierGegevens.get('aantalGasten'));

    if (!Number.isFinite(nieuweWaarde) || nieuweWaarde < 0) return;

    const { payload: p } = await eisIngelogdeGebruiker();
    await p.update({
      collection: 'evenementen',
      id: naarPayloadId(gekozenId) as never,
      data: { aantalGasten: nieuweWaarde },
      overrideAccess: true,
    });

    revalidatePath('/rekenen');
  }

  /**
   * Maakt een bevroren offerte van de huidige stand en slaat hem op. Vanaf dat moment leest de
   * offerte het product niet meer: een latere prijswijziging verandert hem niet meer.
   */
  async function maakOfferte() {
    'use server';
    const { payload: p } = await eisIngelogdeGebruiker();
    await genereerOfferte(p, gekozenId);
    revalidatePath('/rekenen');
  }

  return (
    <AppShell
      pad="/rekenen"
      titel="Dashboard"
      kruimel={`${gebruiker.naam ?? gebruiker.email ?? ''} · ${evenementen.docs.length} evenementen`}
    >
      <nav aria-label="Evenement kiezen" className="kt-keuze" style={{ marginBottom: 'var(--kt-6)' }}>
        {evenementen.docs.map((rij) => (
          <a
            key={rij.id}
            className="kt-keuze__knop"
            href={`/rekenen?evenement=${rij.id}`}
            aria-current={String(rij.id) === gekozenId ? 'true' : undefined}
          >
            {rij.titel}
          </a>
        ))}
      </nav>

      <section className="kt-paneel">
        <div className="kt-paneel__kop">
          <div>
            <h2 className="kt-paneel__titel">{evenement.titel}</h2>
            <p className="kt-paneel__uitleg">
              {formatteerDatum(evenement.datum)}
              {evenement.locatie !== undefined ? ` · ${evenement.locatie}` : ''}
            </p>
          </div>
          <span className="kt-etiket kt-etiket--teal">{evenement.status.replace(/_/g, ' ')}</span>
        </div>

        <form
          action={wijzigGasten}
          style={{ alignItems: 'flex-end', display: 'flex', flexWrap: 'wrap', gap: 'var(--kt-3)' }}
        >
          <label className="kt-veld" style={{ maxWidth: 160 }}>
            <span className="kt-veld__label">Aantal gasten</span>
            <input
              className="kt-invoer"
              type="number"
              name="aantalGasten"
              defaultValue={evenement.aantalGasten}
              min={0}
              inputMode="numeric"
            />
          </label>
          <button className="kt-knop kt-knop--primair" type="submit">
            Herbereken
          </button>
          <p className="kt-paneel__uitleg" style={{ margin: 0 }}>
            Alles hieronder, en elk document, rekent opnieuw door.
          </p>
        </form>
      </section>

      <section className="kt-paneel">
        <div className="kt-paneel__kop">
          <h2 className="kt-paneel__titel">Samenvatting</h2>
        </div>

        <div className="kt-cijfers">
          <div className="kt-cijfer">
            <span className="kt-cijfer__label">Verkoop excl. btw</span>
            <span className="kt-cijfer__waarde">{formatteerBedrag(offerte.subtotaal)}</span>
          </div>
          <div className="kt-cijfer">
            <span className="kt-cijfer__label">Btw</span>
            <span className="kt-cijfer__waarde">{formatteerBedrag(offerte.btwTotaal)}</span>
          </div>
          <div className="kt-cijfer kt-cijfer--nadruk">
            <span className="kt-cijfer__label">Totaal incl. btw</span>
            <span className="kt-cijfer__waarde">{formatteerBedrag(offerte.totaal)}</span>
          </div>
          <div className="kt-cijfer">
            <span className="kt-cijfer__label">Inkoopkostprijs</span>
            <span className="kt-cijfer__waarde">{formatteerBedrag(resultaat.kostprijs)}</span>
          </div>
          <div className="kt-cijfer">
            <span className="kt-cijfer__label">Marge ({resultaat.margePercentage.toFixed(1)}%)</span>
            <span className="kt-cijfer__waarde">{formatteerBedrag(resultaat.marge)}</span>
          </div>
        </div>

        <table className="kt-tabel" style={{ marginTop: 'var(--kt-6)' }}>
          <caption
            className="kt-paneel__uitleg"
            style={{ paddingBottom: 'var(--kt-2)', textAlign: 'left' }}
          >
            Btw per tarief, wettelijk verplicht gesplitst op de factuur
          </caption>
          <thead>
            <tr>
              <th scope="col">Tarief</th>
              <th scope="col" className="kt-getal">
                Grondslag
              </th>
              <th scope="col" className="kt-getal">
                Btw
              </th>
            </tr>
          </thead>
          <tbody>
            {offerte.btwUitsplitsing.map((regel) => (
              <tr key={regel.btwTarief}>
                <td>{regel.percentage}%</td>
                <td className="kt-getal">{formatteerBedrag(regel.grondslag)}</td>
                <td className="kt-getal">{formatteerBedrag(regel.btwBedrag)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="kt-paneel">
        <div className="kt-paneel__kop">
          <h2 className="kt-paneel__titel">Offerte</h2>
          <p className="kt-paneel__uitleg">Prijs per persoon × aantal gasten</p>
        </div>

        <table className="kt-tabel">
          <thead>
            <tr>
              <th scope="col">Gerecht</th>
              <th scope="col" className="kt-getal">
                Gasten
              </th>
              <th scope="col" className="kt-getal">
                Per persoon
              </th>
              <th scope="col" className="kt-getal">
                Btw
              </th>
              <th scope="col" className="kt-getal">
                Totaal
              </th>
            </tr>
          </thead>
          <tbody>
            {offerte.regels.map((regel) => (
              <tr key={regel.product}>
                <td>{regel.productNaam}</td>
                <td className="kt-getal">{regel.aantalGasten}</td>
                <td className="kt-getal">{formatteerBedrag(regel.prijsPerPersoon)}</td>
                <td className="kt-getal">{regel.btwPercentage}%</td>
                <td className="kt-getal">{formatteerBedrag(regel.regelTotaalExcl)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="kt-paneel">
        <div className="kt-paneel__kop">
          <h2 className="kt-paneel__titel">Productie</h2>
          <p className="kt-paneel__uitleg">
            Exacte hoeveelheden per gerecht, gegroepeerd per keukenstation
          </p>
        </div>

        {productie.regels.map((regel) => (
          <div key={regel.product} style={{ marginBottom: 'var(--kt-6)' }}>
            <h3 style={{ fontSize: 15, margin: '0 0 var(--kt-1)' }}>
              {regel.productNaam}
              {regel.receptNaam !== undefined ? ` — ${regel.receptNaam}` : ''}
            </h3>
            <p className="kt-paneel__uitleg" style={{ margin: '0 0 var(--kt-2)' }}>
              {regel.aantalGasten} gasten ×{' '}
              {formatteerHoeveelheid(regel.hoeveelheidPerPersoon, regel.eenheid)}
              {regel.keukenstation !== undefined ? ` · ${regel.keukenstation}` : ''}
            </p>

            {regel.ingredienten.length === 0 ? (
              <p className="kt-paneel__uitleg" style={{ margin: 0 }}>
                Ingekocht artikel, zonder recept
              </p>
            ) : (
              <table className="kt-tabel">
                <thead>
                  <tr>
                    <th scope="col">Ingrediënt</th>
                    <th scope="col" className="kt-getal">
                      Benodigd
                    </th>
                    <th scope="col" className="kt-getal">
                      Kostprijs
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {regel.ingredienten.map((ingredient) => (
                    <tr key={ingredient.ingredient}>
                      <td>{ingredient.naam}</td>
                      <td className="kt-getal">
                        {formatteerHoeveelheid(ingredient.hoeveelheid, ingredient.basisEenheid)}
                      </td>
                      <td className="kt-getal">{formatteerBedrag(ingredient.kostprijs)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ))}
      </section>

      <section className="kt-paneel">
        <div className="kt-paneel__kop">
          <h2 className="kt-paneel__titel">Inkoop</h2>
          <p className="kt-paneel__uitleg">
            Afgerond naar boven op de inkoopeenheid en gegroepeerd per leverancier
          </p>
        </div>

        <table className="kt-tabel">
          <thead>
            <tr>
              <th scope="col">Ingrediënt</th>
              <th scope="col">Leverancier</th>
              <th scope="col" className="kt-getal">
                In te kopen
              </th>
              <th scope="col" className="kt-getal">
                Kostprijs
              </th>
            </tr>
          </thead>
          <tbody>
            {inkoop.regels.map((regel) => (
              <tr key={regel.ingredient}>
                <td>{regel.naam}</td>
                <td style={{ color: 'var(--kt-tekst-gedempt)' }}>{regel.leverancierNaam ?? '—'}</td>
                <td className="kt-getal">
                  {formatteerHoeveelheid(regel.hoeveelheid, regel.inkoopEenheid)}
                </td>
                <td className="kt-getal">{formatteerBedrag(regel.kostprijs)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="kt-paneel">
        <div className="kt-paneel__kop">
          <h2 className="kt-paneel__titel">Materialen</h2>
          <p className="kt-paneel__uitleg">
            Automatisch per gast uit de gerechten, plus wat er handmatig is toegevoegd
          </p>
        </div>

        {materialen.length === 0 ? (
          <p className="kt-paneel__uitleg" style={{ margin: 0 }}>
            Aan de gerechten van dit evenement zijn nog geen materialen gekoppeld. Dat doe je op het
            product zelf, onder &ldquo;Benodigde materialen&rdquo;.
          </p>
        ) : (
          <table className="kt-tabel">
            <thead>
              <tr>
                <th scope="col">Materiaal</th>
                <th scope="col" className="kt-getal">
                  Uit de gerechten
                </th>
                <th scope="col" className="kt-getal">
                  Handmatig
                </th>
                <th scope="col" className="kt-getal">
                  Totaal
                </th>
                <th scope="col">Herkomst</th>
              </tr>
            </thead>
            <tbody>
              {materialen.map((regel) => (
                <tr key={regel.materiaal}>
                  <td>{regel.naam}</td>
                  <td className="kt-getal">
                    {regel.automatisch === 0
                      ? '—'
                      : formatteerHoeveelheid(regel.automatisch, regel.eenheid)}
                  </td>
                  <td className="kt-getal">
                    {regel.handmatig === 0
                      ? '—'
                      : formatteerHoeveelheid(regel.handmatig, regel.eenheid)}
                  </td>
                  <td className="kt-getal">
                    <strong>{formatteerHoeveelheid(regel.totaal, regel.eenheid)}</strong>
                  </td>
                  <td style={{ color: 'var(--kt-tekst-gedempt)', fontSize: 13 }}>
                    {regel.herkomst.length > 0 ? regel.herkomst.join(', ') : 'Handmatig toegevoegd'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="kt-paneel">
        <div className="kt-paneel__kop">
          <h2 className="kt-paneel__titel">Allergenen per gerecht</h2>
          <p className="kt-paneel__uitleg">Afgeleid uit de ingrediënten van elk recept</p>
        </div>

        {onbekendeAllergenen.length > 0 && (
          <div className="kt-melding kt-melding--let-op" style={{ marginBottom: 'var(--kt-4)' }}>
            <div>
              <strong>{t('documentKoppen.allergenenOnbekend')}</strong>
              <p className="kt-melding__tekst" style={{ marginTop: 'var(--kt-1)' }}>
                {t('documentKoppen.allergenenOnbekendUitleg')}
              </p>
              <ul className="kt-melding__lijst">
                {onbekendeAllergenen.map((product) => (
                  <li key={product.id}>
                    <Link href={`/admin/collections/producten/${product.id}`}>{product.naam}</Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <table className="kt-tabel">
          <thead>
            <tr>
              <th scope="col">Gerecht</th>
              <th scope="col">Allergenen</th>
            </tr>
          </thead>
          <tbody>
            {allergenenPerProduct.map((regel) => (
              <tr key={regel.product}>
                <td>{regel.naam}</td>
                <td
                  style={{
                    color: regel.allergenen.length === 0 ? 'var(--kt-tekst-gedempt)' : 'inherit',
                  }}
                >
                  {regel.allergenen.length === 0
                    ? t('documentKoppen.geenAllergenen')
                    : regel.allergenen.map((allergeen) => allergeen.naam).join(', ')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="kt-paneel">
        <div className="kt-paneel__kop">
          <h2 className="kt-paneel__titel">Documenten</h2>
          <p className="kt-paneel__uitleg">
            Alles op A4, met dezelfde opmaak op het scherm als op papier
          </p>
        </div>

        <div
          className={`kt-melding ${
            opgeslagenOfferte === undefined ? 'kt-melding--waarschuwing' : 'kt-melding--goed'
          }`}
          style={{ alignItems: 'center', marginBottom: 'var(--kt-4)' }}
        >
          {opgeslagenOfferte === undefined ? (
            <>
              <form action={maakOfferte}>
                <button className="kt-knop kt-knop--primair" type="submit">
                  Offerte genereren
                </button>
              </form>
              <p className="kt-melding__tekst">
                Maakt een bevroren momentopname van deze berekening. Daarna verandert een
                prijswijziging deze offerte niet meer.
              </p>
            </>
          ) : (
            <>
              <form action={maakOfferte}>
                <button className="kt-knop kt-knop--secundair" type="submit">
                  Nieuwe versie
                </button>
              </form>
              <p className="kt-melding__tekst">
                Offerte <strong>versie {opgeslagenOfferte.versie}</strong> staat vast en is geldig
                tot {formatteerDatum(opgeslagenOfferte.geldigTot)}.
              </p>
            </>
          )}
        </div>

        <div className="kt-documenten">
          {EVENEMENT_DOCUMENTEN.map((type) => (
            <div className="kt-document" key={type}>
              <span className="kt-document__naam">{DOCUMENT_LABELS[type]}</span>
              <a
                className="kt-knop kt-knop--secundair"
                href={`/documenten/${type}/${gekozenId}`}
                target="_blank"
                rel="noreferrer"
              >
                Bekijken
              </a>
              <a className="kt-knop kt-knop--secundair" href={`/documenten/${type}/${gekozenId}/pdf`}>
                PDF
              </a>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}

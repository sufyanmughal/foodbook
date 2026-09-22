import config from '@payload-config';
import { formatteerBedrag, t } from '@foodbook/i18n';
import Image from 'next/image';
import Link from 'next/link';
import { getPayload } from 'payload';
import React from 'react';

import { AppShell } from '@/design/AppShell';

// De Foodbook leest live uit dezelfde data als de beheeromgeving, dus nooit vooraf renderen.
export const dynamic = 'force-dynamic';

interface FoodbookFoto {
  url?: string;
  alt?: string;
  sizes?: Record<string, { url?: string } | undefined>;
}

interface FoodbookProduct {
  id: number | string;
  naam: string;
  prijsPerPersoon: number;
  eenheid: string;
  hoeveelheidPerPersoon: number;
  hoofdfoto?: FoodbookFoto | null;
  categorie?: { naam?: string } | number | string | null;
}

interface FoodbookCategorie {
  naam: string;
  producten: FoodbookProduct[];
}

async function haalProducten(): Promise<FoodbookProduct[]> {
  const payload = await getPayload({ config });
  const resultaat = await payload.find({
    collection: 'producten',
    where: { actief: { equals: true } },
    depth: 2,
    limit: 200,
    sort: 'naam',
  });
  return resultaat.docs as unknown as FoodbookProduct[];
}

function groepeerPerCategorie(producten: FoodbookProduct[]): FoodbookCategorie[] {
  const groepen = new Map<string, FoodbookProduct[]>();

  for (const product of producten) {
    const naam =
      typeof product.categorie === 'object' && product.categorie !== null
        ? (product.categorie.naam ?? t('algemeen.overig'))
        : t('algemeen.overig');
    const bestaand = groepen.get(naam) ?? [];
    bestaand.push(product);
    groepen.set(naam, bestaand);
  }

  return [...groepen.entries()]
    .map(([naam, items]) => ({ naam, producten: items }))
    .sort((a, b) => a.naam.localeCompare(b.naam, 'nl'));
}

const Page = async () => {
  const producten = await haalProducten();
  const categorieen = groepeerPerCategorie(producten);

  return (
    <AppShell
      pad="/"
      titel={t('algemeen.foodbook')}
      kruimel="De presentatie zoals de klant die te zien krijgt"
    >
      <section className="fb-held">
        <div className="fb-held__binnen">
          <p className="fb-held__belofte">Lokaal · Puur · Duurzaam · Gastvrij</p>
          <h2 className="fb-held__titel">Foodbook</h2>
          <p className="fb-held__onder">Van ontbijt tot afterparty</p>
        </div>
      </section>

      {producten.length === 0 ? (
        <div className="kt-paneel" style={{ marginTop: 'var(--kt-6)' }}>
          <h3 className="kt-paneel__titel">Nog geen gerechten in de Foodbook</h3>
          <p className="kt-paneel__uitleg">
            Zodra er producten op actief staan, verschijnen ze hier. Voeg ze toe bij{' '}
            <Link href="/admin/collections/producten">Producten</Link>.
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 'var(--kt-9)', marginTop: 'var(--kt-6)' }}>
          {categorieen.map((categorie) => (
            <section key={categorie.naam}>
              <h3
                style={{
                  fontFamily: 'var(--kt-serif)',
                  fontSize: 24,
                  fontWeight: 600,
                  margin: '0 0 var(--kt-4)',
                }}
              >
                {categorie.naam}
              </h3>

              <div className="fb-categorieen">
                {categorie.producten.map((product) => {
                  const foto =
                    product.hoofdfoto?.sizes?.['foodbook-card']?.url ?? product.hoofdfoto?.url;

                  return (
                    <article className="fb-categorie" key={product.id}>
                      {foto !== undefined ? (
                        <Image
                          className="fb-categorie__beeld"
                          src={foto}
                          alt={product.hoofdfoto?.alt ?? product.naam}
                          width={800}
                          height={600}
                          sizes="(max-width: 900px) 100vw, 280px"
                        />
                      ) : (
                        <div className="fb-categorie__beeld" aria-hidden="true" />
                      )}

                      <div className="fb-categorie__tekst">
                        <h4 className="fb-categorie__naam">{product.naam}</h4>
                        <p className="fb-categorie__prijs">
                          {formatteerBedrag(product.prijsPerPersoon)} per persoon ·{' '}
                          {product.hoeveelheidPerPersoon} {product.eenheid}
                        </p>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}
    </AppShell>
  );
};

export default Page;

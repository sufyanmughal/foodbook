import React from 'react';
import type { DocumentModel, DocumentRij, DocumentSectie } from '../model';

/**
 * De merkgegevens die het sjabloon nodig heeft (§5: logo en kleuren uit Bedrijfsinstellingen).
 * Bewust een kleine, eigen vorm: het sjabloon hoeft niets te weten van de opslaglaag.
 */
export interface Merkgegevens {
  logo?: string | { url?: string } | null;
  primaireKleur?: string;
  secundaireKleur?: string;
}

/**
 * Het enige documentsjabloon.
 *
 * Alle negen documenttypes uit §5 verschillen alleen in hun *inhoud* — die zit al in het
 * `DocumentModel` — niet in hun opmaak. Daardoor is er één component dat naar scherm, printer
 * en PDF rendert, en hoeft een nieuw documenttype alleen een modelbouwer te zijn.
 */
export function Document({ model, merk }: { model: DocumentModel; merk?: Merkgegevens }) {
  const logo = logoUrl(merk);

  return (
    <article className="fb-document" style={kleurVariabelen(merk)}>
      <header className="fb-kop">
        <div>
          {logo !== undefined && <img className="fb-kop__merk" src={logo} alt="" />}
          <h1 className="fb-titel">{model.titel}</h1>
          {model.ondertitel !== undefined && <p className="fb-ondertitel">{model.ondertitel}</p>}
        </div>

        {model.meta.length > 0 && (
          <table className="fb-meta">
            <tbody>
              {model.meta.map((regel, index) => (
                <tr key={`${regel.label}-${index}`}>
                  <th scope="row">{regel.label}</th>
                  <td>{regel.waarde}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </header>

      {model.blokken.length > 0 && (
        <div className="fb-blokken">
          {model.blokken.map((blok, index) => (
            <section className="fb-blok" key={`${blok.titel}-${index}`}>
              <h2 className="fb-blok__titel">{blok.titel}</h2>
              <ul className="fb-blok__regels">
                {blok.regels.map((regel, regelIndex) => (
                  <li key={regelIndex}>{regel}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      {model.secties.map((sectie, index) => (
        <Sectie sectie={sectie} key={`${sectie.titel ?? 'sectie'}-${index}`} />
      ))}

      {model.totalen.length > 0 && (
        <table className="fb-totalen">
          <tbody>
            {model.totalen.map((regel, index) => (
              <tr
                className={regel.nadruk === true ? 'fb-totaal--nadruk' : undefined}
                key={`${regel.label}-${index}`}
              >
                <th scope="row">{regel.label}</th>
                <td>{regel.waarde}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {model.voettekst.length > 0 && <footer className="fb-voettekst">{model.voettekst}</footer>}
    </article>
  );
}

function Sectie({ sectie }: { sectie: DocumentSectie }) {
  const totaalBreedte = (sectie.breedtes ?? []).reduce((acc, waarde) => acc + waarde, 0);

  return (
    <section className="fb-sectie">
      {sectie.titel !== undefined && <h2 className="fb-sectie__titel">{sectie.titel}</h2>}

      <table className={sectie.matrix === true ? 'fb-tabel fb-tabel--matrix' : 'fb-tabel'}>
        {sectie.breedtes !== undefined && totaalBreedte > 0 && (
          <colgroup>
            {sectie.breedtes.map((breedte, index) => (
              <col key={index} style={{ width: `${(breedte / totaalBreedte) * 100}%` }} />
            ))}
          </colgroup>
        )}
        <thead>
          <tr>
            {sectie.kolommen.map((kolom, index) => (
              <th scope="col" key={`${kolom}-${index}`}>
                {kolom}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sectie.rijen.map((rij, index) => (
            <Rij rij={rij} key={index} />
          ))}
        </tbody>
      </table>
    </section>
  );
}

function Rij({ rij }: { rij: DocumentRij }) {
  const klassen = [
    rij.nadruk === true ? 'fb-rij--nadruk' : undefined,
    rij.afvinkbaar === true ? 'fb-rij--afvinkbaar' : undefined,
  ]
    .filter((klasse): klasse is string => klasse !== undefined)
    .join(' ');

  return (
    <tr className={klassen.length > 0 ? klassen : undefined}>
      {rij.cellen.map((cel, index) => (
        <td key={index}>{cel}</td>
      ))}
    </tr>
  );
}

function logoUrl(merk: Merkgegevens | undefined): string | undefined {
  const logo = merk?.logo;
  const url =
    typeof logo === 'string'
      ? logo
      : typeof logo === 'object' && logo !== null && typeof logo.url === 'string'
        ? logo.url
        : undefined;

  if (url === undefined) return undefined;
  // React saneert `src` niet: een javascript:-URL zou hier een XSS-gat zijn.
  return /^(https?:\/\/|\/|data:image\/)/i.test(url) ? url : undefined;
}

function kleurVariabelen(merk: Merkgegevens | undefined): React.CSSProperties | undefined {
  if (merk === undefined) return undefined;

  const variabelen: Record<string, string> = {};
  if (typeof merk.primaireKleur === 'string') variabelen['--fb-primair'] = merk.primaireKleur;
  if (typeof merk.secundaireKleur === 'string') variabelen['--fb-secundair'] = merk.secundaireKleur;

  return Object.keys(variabelen).length > 0 ? (variabelen as React.CSSProperties) : undefined;
}

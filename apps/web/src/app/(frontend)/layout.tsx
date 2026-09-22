import type { Metadata } from 'next';
import React from 'react';

import './app.css';

export const metadata: Metadata = {
  title: 'De Krim Texel — Foodbook',
  description: 'Van het eiland. Voor ieder moment.',
  robots: { index: false, follow: false },
};

type Args = {
  children: React.ReactNode;
};

/**
 * Losse root-layout naast die van Payload: de Foodbook-presentatie en de rekenschermen zijn een
 * eigen oppervlakte, geen onderdeel van de beheeromgeving.
 *
 * Hier wordt ook het designsysteem geladen, zodat elke pagina in deze groep dezelfde tokens,
 * typografie en chrome heeft.
 */
const Layout = ({ children }: Args) => (
  <html lang="nl">
    <body className="kt-body">{children}</body>
  </html>
);

export default Layout;

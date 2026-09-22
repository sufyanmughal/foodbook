import config from '@payload-config';
import '@payloadcms/next/css';
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts';
import type { ServerFunctionClient } from 'payload';
import React from 'react';

import { importMap } from './admin/importMap';
import './custom.scss';

type Args = {
  children: React.ReactNode;
};

/**
 * De brug tussen de beheeromgeving in de browser en de server.
 *
 * Dit moet een echte server action zijn (`'use server'`), geen inline functie: Next staat niet
 * toe dat er een functie van een Server Component naar een Client Component wordt doorgegeven.
 * Zonder deze directive start de beheeromgeving niet en geeft elke /admin-route een 500.
 */
const serverFunction: ServerFunctionClient = async function (args) {
  'use server';
  return handleServerFunctions({ ...args, config, importMap });
};

const Layout = ({ children }: Args) => (
  <RootLayout config={config} importMap={importMap} serverFunction={serverFunction}>
    {children}
  </RootLayout>
);

export default Layout;

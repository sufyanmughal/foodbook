import next from 'eslint-config-next/core-web-vitals';

/**
 * ESLint met de Next.js-regelset (inclusief core-web-vitals en de TypeScript-regels).
 *
 * Next 16 levert een flat config; die spreiden we hier uit en vullen we aan met de mappen die
 * niet gelint hoeven te worden.
 */
const config = [
  ...next,
  {
    ignores: [
      '.next/**',
      'next-env.d.ts',
      'src/payload-types.ts',
      'src/app/(payload)/admin/importMap.js',
    ],
  },
];

export default config;

// @ts-check

import preact from '@astrojs/preact';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://cambio.akanyane.dev',
  // compat aliases `react` to preact/compat, so components keep React-style imports
  integrations: [preact({ compat: true })],
});

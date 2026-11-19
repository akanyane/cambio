// @ts-check

import react from '@astrojs/react';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://cambio.akanyane.dev',
  integrations: [react()],
});

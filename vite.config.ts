import { defineConfig } from 'vite';
import { CITIES } from './src/cities/index.ts';
import { cityPages } from './src/core/pages.ts';

export default defineConfig({
  base: './',
  // a page per city, from one template
  plugins: [cityPages(CITIES)],
  // MapLibre starts its worker as an ES module
  worker: { format: 'es' },
});

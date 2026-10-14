import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  // MapLibre starts its worker as an ES module
  worker: { format: 'es' },
});

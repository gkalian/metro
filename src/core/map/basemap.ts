import type { ExpressionSpecification, Map as MlMap, StyleSpecification } from 'maplibre-gl';
import { lang, localLang } from '../app/i18n';

export type Theme = 'light' | 'dark';
export const THEMES: readonly Theme[] = ['light', 'dark'];

// OpenFreeMap: free OSM vector tiles, no API key.
const BASEMAP: Record<Theme, string> = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
};

// Montserrat glyphs are built from the Google Fonts TTFs and served from public/fonts.
// from the site root, which the page names: a city's page may sit a folder deeper
const SITE_ROOT = new URL(document.documentElement.dataset.root ?? './', document.baseURI);
const GLYPHS = `${new URL('fonts/', SITE_ROOT).href}{fontstack}/{range}.pbf`;
export const FONT_BOLD = ['Montserrat SemiBold'];
export const FONT_REGULAR = ['Montserrat Regular'];
const FONT_ITALIC = ['Montserrat Italic'];

/** Replaces the map's style with the theme's basemap; the network layers are added on `style.load`. */
export function loadBasemap(map: MlMap, theme: Theme): void {
  map.setStyle(BASEMAP[theme], { transformStyle: (_, next) => withMontserrat(next) });
}

/**
 * Basemap names in the page's language where the tiles carry them. Otherwise the local name in
 * the city's own language, and for a reader of another one the Latin spelling before it: Greek
 * names on the Russian map of Thessaloniki, but Cyrillic ones on the Russian map of Petersburg.
 * The Greek letters in the glyphs come from Manrope: Montserrat has none.
 */
export function localizeBasemap(map: MlMap): void {
  const l = lang();
  const latin: ExpressionSpecification[] = l === localLang() ? [] : [['get', 'name:latin']];
  const field: ExpressionSpecification = ['coalesce', ['get', `name:${l}`], ...latin, ['get', 'name']];
  for (const layer of map.getStyle().layers) {
    if (layer.type !== 'symbol' || !layer.layout?.['text-field']) continue;
    if (!JSON.stringify(layer.layout['text-field']).includes('name')) continue;
    map.setLayoutProperty(layer.id, 'text-field', field);
  }
}

/** Points the basemap at the Montserrat glyphs, keeping its bold and italic labels. */
function withMontserrat(style: StyleSpecification): StyleSpecification {
  const font = (stack: string[]) =>
    stack.some((f) => f.includes('Bold')) ? FONT_BOLD : stack.some((f) => f.includes('Italic')) ? FONT_ITALIC : FONT_REGULAR;
  return {
    ...style,
    glyphs: GLYPHS,
    layers: style.layers.map((layer) => {
      if (layer.type !== 'symbol' || !layer.layout?.['text-font']) return layer;
      const stack = layer.layout['text-font'];
      return {
        ...layer,
        layout: { ...layer.layout, 'text-font': Array.isArray(stack) ? font(stack as string[]) : FONT_REGULAR },
      };
    }),
  };
}

import type { Map as MlMap, StyleSpecification } from 'maplibre-gl';

export type Theme = 'light' | 'dark';
export const THEMES: readonly Theme[] = ['light', 'dark'];

// OpenFreeMap: free OSM vector tiles, no API key.
const BASEMAP: Record<Theme, string> = {
  light: 'https://tiles.openfreemap.org/styles/positron',
  dark: 'https://tiles.openfreemap.org/styles/dark',
};

// Montserrat glyphs are built from the Google Fonts TTFs and served from public/fonts.
const GLYPHS = `${new URL('fonts/', document.baseURI).href}{fontstack}/{range}.pbf`;
export const FONT_BOLD = ['Montserrat SemiBold'];
export const FONT_REGULAR = ['Montserrat Regular'];
const FONT_ITALIC = ['Montserrat Italic'];

/** Replaces the map's style with the theme's basemap; the network layers are added on `style.load`. */
export function loadBasemap(map: MlMap, theme: Theme): void {
  map.setStyle(BASEMAP[theme], { transformStyle: (_, next) => withMontserrat(next) });
}

/** Prefer Russian names on the basemap where the tiles carry them. */
export function localizeBasemap(map: MlMap): void {
  for (const layer of map.getStyle().layers) {
    if (layer.type !== 'symbol' || !layer.layout?.['text-field']) continue;
    if (!JSON.stringify(layer.layout['text-field']).includes('name')) continue;
    map.setLayoutProperty(layer.id, 'text-field', ['coalesce', ['get', 'name:ru'], ['get', 'name']]);
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

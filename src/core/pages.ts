/**
 * A page per city, made from one template: `index.html` for the main city, `<path>index.html`
 * for the others. Vite gets them from this plugin, in development and in the build alike, so
 * there are no HTML files to keep in step by hand.
 */
import type { Plugin } from 'vite';
import type { Lang } from './app/i18n.ts';
import type { City } from './city.ts';

const SITE = 'https://gkalian.github.io/metro/';
const REPO = 'https://github.com/gkalian/metro';

const SUBTITLE: Record<Lang, string> = {
  ru: 'интерактивная карта и время в пути',
  en: 'interactive map and travel times',
  el: 'διαδραστικός χάρτης και χρόνοι διαδρομής',
};

const esc = (s: string) => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');

/** `data-en="…" data-el="…"` for the static-text switcher (`ui/static-text.ts`). */
const translations = (texts: Record<Lang, string>, attr = '') =>
  (['en', 'el'] as const).map((l) => ` data-${l}${attr && `-${attr}`}="${esc(texts[l])}"`).join('');

/** From the city's page up to the site root, e.g. '../' from thessaloniki/. */
const rootOf = (city: City) => '../'.repeat(city.path.split('/').filter(Boolean).length) || './';

const favicon = (color: string) =>
  `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Ccircle cx='16' cy='16' r='15' fill='${color.replace('#', '%23')}'/%3E%3Cpath d='M7 23V10h3l6 9 6-9h3v13h-3v-8l-6 9-6-9v8z' fill='%23fff'/%3E%3C/svg%3E`;

/** The heading; with other cities it opens a list of links to their pages. */
function heading(city: City, cities: City[]): string {
  const h1 = `<h1${translations(city.title)}>${esc(city.title.ru)}</h1>`;
  const others = cities.filter((c) => c !== city);
  if (!others.length) return h1;
  const links = others
    .map((c) => `<li><a href="${rootOf(city)}${c.path}"${translations(c.title)}>${esc(c.title.ru)}</a></li>`)
    .join('\n            ');
  return `<details class="city" id="city">
          <summary class="city__summary" title="Другие города" data-en-title="Other cities" data-el-title="Άλλες πόλεις">
            ${h1}<span class="city__chevron" aria-hidden="true"></span>
          </summary>
          <ul class="city__list">
            ${links}
          </ul>
        </details>`;
}

/** The preview has the title above it: «Интерактивная карта метро …: маршрут, …» → «Маршрут, …». */
const previewText = (description: string) => description.replace(/^[^:]*: /, '').replace(/^./, (c) => c.toUpperCase());

export function renderPage(city: City, cities: City[]): string {
  const url = SITE + city.path;
  const title = (l: Lang) => `${city.title[l]} — ${SUBTITLE[l]}`;
  const fonts = city.langs.includes('el') ? '&family=Manrope:wght@400..700' : '';
  return `<!doctype html>
<html lang="ru" data-city="${city.id}" data-root="${rootOf(city)}">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light dark" />
    <link rel="icon" href="${favicon(city.color)}" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,400..700;1,400${fonts}&display=swap" rel="stylesheet" />
    <title${translations({ ru: title('ru'), en: title('en'), el: title('el') })}>${esc(title('ru'))}</title>
    <meta name="description" content="${esc(city.description)}" />
    <link rel="canonical" href="${url}" />
    <!-- Link previews (Telegram, VK, WhatsApp, Slack, X…) need absolute URLs -->
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="ru_RU" />
    <meta property="og:site_name" content="${esc(city.title.ru)}" />
    <meta property="og:title" content="${esc(title('ru'))}" />
    <meta property="og:description" content="${esc(previewText(city.description))}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${url}og.jpg" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="${esc(city.imageAlt)}" />
    <meta name="twitter:card" content="summary_large_image" />
  </head>
  <body>
    <div id="map"></div>

    <button id="sidebar-toggle" class="sidebar-toggle" type="button" aria-controls="panel" aria-expanded="true" title="Свернуть панель" aria-label="Свернуть панель">
      <span class="sidebar-toggle__chevron" aria-hidden="true"></span>
    </button>
    <aside class="panel" id="panel">
      <header class="panel__head">
        ${heading(city, cities)}
        <div class="panel__actions">
          <button id="lang" class="icon-btn icon-btn--text" type="button" title="Язык / Language${city.langs.includes('el') ? ' / Γλώσσα' : ''}">RU</button>
          <button id="theme" class="icon-btn" type="button" title="Светлая / тёмная карта" aria-label="Сменить тему" data-en-title="Light / dark map" data-en-aria-label="Switch theme" data-el-title="Ανοιχτός / σκοτεινός χάρτης" data-el-aria-label="Αλλαγή θέματος">◐</button>
        </div>
      </header>

      <div class="pickers">
        <div class="pickers__fields">
          <div class="picker" id="picker-from"></div>
          <div class="picker" id="picker-to"></div>
        </div>
        <button id="swap" class="icon-btn" type="button" title="Поменять местами" aria-label="Поменять местами" data-en-title="Swap" data-en-aria-label="Swap" data-el-title="Αντιστροφή" data-el-aria-label="Αντιστροφή">⇅</button>
      </div>

      <section id="result" class="result" aria-live="polite"></section>

      <div class="options">
        <!-- shown once the city's data turns out to have suburban rail -->
        <label class="option" hidden><input type="checkbox" id="show-rail" /> <span data-en="Show railway stations" data-el="Εμφάνιση σιδηροδρομικών σταθμών">Показывать железнодорожные станции</span></label>
        <label class="option"><input type="checkbox" id="show-planned" /> <span data-en="Show future stations" data-el="Εμφάνιση μελλοντικών σταθμών">Показывать будущие станции</span></label>
      </div>

      <section class="fold">
        <button id="chronology-toggle" class="fold__toggle" type="button" aria-expanded="true" aria-controls="chronology">
          <span><span data-en="Chronology" data-el="Χρονολόγιο">Хронология</span><span id="chronology-value" class="fold__value"></span></span>
          <span class="fold__chevron" aria-hidden="true"></span>
        </button>
        <div id="chronology" class="fold__body chronology">
          <input type="range" id="horizon" min="0" step="1" value="0" aria-label="Состояние сети на год" data-en-aria-label="Network as of year" data-el-aria-label="Το δίκτυο κατά το έτος" />
          <div class="chronology__ticks" id="horizon-ticks"></div>
        </div>
      </section>

      <section class="fold fold--legend">
        <button id="legend-toggle" class="fold__toggle" type="button" aria-expanded="false" aria-controls="legend">
          <span data-en="Legend" data-el="Υπόμνημα">Условные обозначения</span>
          <span class="fold__chevron" aria-hidden="true"></span>
        </button>
        <ul id="legend" class="fold__body legend" hidden></ul>
      </section>

      <footer class="footer">
        <span>gkalian © 2026</span>
        <span class="footer__sep" aria-hidden="true">|</span>
        <a class="footer__link" href="${REPO}" target="_blank" rel="noopener noreferrer" title="Исходный код на GitHub" aria-label="Исходный код на GitHub" data-en-title="Source code on GitHub" data-en-aria-label="Source code on GitHub" data-el-title="Πηγαίος κώδικας στο GitHub" data-el-aria-label="Πηγαίος κώδικας στο GitHub">
          <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
            <path fill="currentColor" d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
          </svg>
        </a>
      </footer>
    </aside>

    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`;
}

/** Serves and builds the city pages; see the top of this file. */
export function cityPages(cities: City[]): Plugin {
  const pages = new Map(cities.map((c) => [`${c.path}index.html`, c]));
  let root = '';
  // a page's id as Vite gives it, relative to the project root
  const pageOf = (id: string) => pages.get(id.replaceAll('\\', '/').replace(root, '').replace(/^\//, ''));
  return {
    name: 'city-pages',
    config: () => ({
      build: { rolldownOptions: { input: Object.fromEntries(cities.map((c) => [c.id, `${c.path}index.html`])) } },
    }),
    configResolved(config) {
      root = config.root.replaceAll('\\', '/');
    },
    resolveId(id) {
      return pageOf(id) ? `${root}/${id.replaceAll('\\', '/').replace(root, '').replace(/^\//, '')}` : null;
    },
    load(id) {
      const city = pageOf(id);
      return city ? renderPage(city, cities) : null;
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        // the project has no Node types; Vite's request is Node's
        const url = (req as { url?: string }).url ?? '/';
        const path = url.split('?')[0]!.replace(/^\//, '');
        const city = pages.get(path.endsWith('/') || !path ? `${path}index.html` : path);
        if (!city) return next();
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.end(await server.transformIndexHtml(url, renderPage(city, cities)));
      });
    },
  };
}

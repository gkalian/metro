import { lang } from '../app/i18n';

const ATTRS = ['title', 'aria-label', 'placeholder'];

/**
 * Switches the page's fixed texts to the current language. An element carries its English
 * in `data-en` (text) or `data-en-<attribute>`, its Greek in `data-el` / `data-el-<attribute>`;
 * the Russian from the markup is kept aside the first time, so switching back restores it.
 * A text missing in a language is given in English.
 */
export function translatePage(root: ParentNode = document): void {
  const l = lang();
  for (const el of root.querySelectorAll<HTMLElement>('[data-en]')) {
    el.dataset.ru ??= el.textContent ?? '';
    el.textContent = el.dataset[l] ?? el.dataset.en!;
  }
  for (const attr of ATTRS) {
    for (const el of root.querySelectorAll(`[data-en-${attr}]`)) {
      const ru = `data-ru-${attr}`;
      if (!el.hasAttribute(ru)) el.setAttribute(ru, el.getAttribute(attr) ?? '');
      el.setAttribute(attr, el.getAttribute(l === 'ru' ? ru : `data-${l}-${attr}`) ?? el.getAttribute(`data-en-${attr}`)!);
    }
  }
}

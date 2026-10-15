import { lang } from '../app/i18n';

const ATTRS = ['title', 'aria-label', 'placeholder'];

/**
 * Switches the page's fixed texts to the current language. An element carries its English
 * in `data-en` (text) or `data-en-<attribute>`; the Russian from the markup is kept aside
 * the first time, so switching back restores it.
 */
export function translatePage(root: ParentNode = document): void {
  const en = lang() === 'en';
  for (const el of root.querySelectorAll<HTMLElement>('[data-en]')) {
    el.dataset.ru ??= el.textContent ?? '';
    el.textContent = en ? el.dataset.en! : el.dataset.ru;
  }
  for (const attr of ATTRS) {
    for (const el of root.querySelectorAll(`[data-en-${attr}]`)) {
      const ru = `data-ru-${attr}`;
      if (!el.hasAttribute(ru)) el.setAttribute(ru, el.getAttribute(attr) ?? '');
      el.setAttribute(attr, el.getAttribute(en ? `data-en-${attr}` : ru)!);
    }
  }
}

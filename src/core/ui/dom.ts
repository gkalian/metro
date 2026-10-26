type Child = Node | string | null | false | undefined;

/** Creates an element with properties, CSS custom properties and children; falsy children are skipped. */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props: Partial<Omit<HTMLElementTagNameMap[K], 'style'>> & { css?: Record<string, string> } = {},
  ...children: Child[]
): HTMLElementTagNameMap[K] {
  const { css, ...rest } = props;
  const el = Object.assign(document.createElement(tag), rest);
  if (css) for (const [k, v] of Object.entries(css)) el.style.setProperty(k, v);
  el.append(...children.filter((c): c is Node | string => c !== null && c !== false && c !== undefined));
  return el;
}

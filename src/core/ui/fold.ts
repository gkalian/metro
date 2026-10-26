import { loadFlag, saveFlag } from '../app/storage';

/** A section heading folds its body; the choice is remembered per browser under `key`. */
export function bindFold(button: HTMLButtonElement, body: HTMLElement, key: string, folded: boolean): void {
  const apply = (collapsed: boolean) => {
    body.hidden = collapsed;
    button.setAttribute('aria-expanded', String(!collapsed));
  };
  apply(loadFlag(key, folded));
  button.addEventListener('click', () => {
    const collapsed = !body.hidden;
    apply(collapsed);
    saveFlag(key, collapsed);
  });
}

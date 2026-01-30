/**
 * ♨️ Viand SSR Renderer (The Oven)
 * Produces static HTML strings from Signal-based components.
 */

export const signal = (val: any) => ({ value: val, peek: () => val });
export const computed = (fn: () => any) => ({ value: fn(), peek: fn });
export const effect = (fn: () => any) => {};

export function h(tag: string | Function, props: any = {}, children: any[] = []): string {
  if (typeof tag === 'function') {
    return tag(props);
  }

  const attrs = Object.entries(props)
    .filter(([key]) => !key.startsWith('on') && !key.startsWith('bind:'))
    .map(([key, value]) => {
      const val = (value && typeof value === 'object' && 'value' in value) ? value.value : value;
      if (key === 'class') return `class="${val}"`;
      if (key.startsWith('class:')) {
          const className = key.split(':')[1];
          return val ? className : '';
      }
      return `${key}="${val}"`;
    })
    .filter(a => a)
    .join(' ');

  const flatChildren = flatten(children).map(c => {
      if (c && typeof c === 'object' && 'value' in c) return String(c.value);
      return String(c);
  }).join('');

  return `<${tag}${attrs ? ' ' + attrs : ''}>${flatChildren}</${tag}>`;
}

export function renderList(listSignal: any, itemTemplate: (item: any) => string) {
  const list = listSignal.value || [];
  return list.map((item: any) => itemTemplate({ value: item })).join('');
}

export function renderMatch(exprSignal: any, cases: any[], defaultTemplate: any) {
  const val = exprSignal.value;
  const match = cases.find(c => c.condition === val);
  return match ? match.template() : defaultTemplate();
}

export function mount(targetId: string, component: () => string) {
    // SSR mount just returns the string
    return component();
}

function flatten(arr: any[]): any[] {
  return arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val), []);
}

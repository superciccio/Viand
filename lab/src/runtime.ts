import { effect, signal, ReadonlySignal, computed } from "@preact/signals-core";

export { signal, computed, effect };

type Props = Record<string, any>;
type Child = HTMLElement | string | ReadonlySignal<any> | Child[];

export function h(tag: string, props: Props = {}, children: Child[] = []): HTMLElement {
  const el = document.createElement(tag);

  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('on') && typeof value === 'function') {
      const event = key.toLowerCase().slice(2);
      el.addEventListener(event, value);
    } else if (value && typeof value === 'object' && 'value' in value) {
      effect(() => {
        if (key === 'class') el.className = value.value;
        else if (key === 'text') el.textContent = value.value;
        else (el as any)[key] = value.value;
      });
    } else {
      if (key === 'class') el.className = value;
      else if (key === 'text') el.textContent = value;
      else (el as any)[key] = value;
    }
  }

  const addChildren = (c: Child | Child[]) => {
    if (Array.isArray(c)) {
      c.forEach(addChildren);
    } else if (c instanceof HTMLElement) {
      el.appendChild(c);
    } else if (c && typeof c === 'object' && 'value' in c) {
      const textNode = document.createTextNode("");
      effect(() => { textNode.textContent = String((c as any).value); });
      el.appendChild(textNode);
    } else if (c !== undefined && c !== null && c !== "null") {
      el.appendChild(document.createTextNode(String(c)));
    }
  };

  addChildren(children);
  return el;
}

export function renderList(parent: HTMLElement, listSignal: any, itemTemplate: (item: any) => HTMLElement) {
  effect(() => {
    parent.innerHTML = '';
    listSignal.value.forEach((item: any) => {
      parent.appendChild(itemTemplate(item));
    });
  });
}

export function mount(target: HTMLElement, component: () => HTMLElement) {
  target.innerHTML = '';
  target.appendChild(component());
}
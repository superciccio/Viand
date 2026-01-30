import { effect, signal } from "@preact/signals-core";

/**
 * 🎨 The Viand "Painter"
 * Glues a reactive signal to a DOM property.
 */
export function bind(el: HTMLElement, prop: string, signal: any) {
  effect(() => {
    if (prop === 'text') {
      el.textContent = signal.value;
    } else if (prop === 'value' && el instanceof HTMLInputElement) {
      el.value = signal.value;
    } else {
      (el as any)[prop] = signal.value;
    }
  });
}

/**
 * 🧬 The Viand "Mounter"
 * Simple entry point to inject a component into the DOM.
 */
export function mount(target: HTMLElement, component: () => HTMLElement) {
  target.innerHTML = '';
  target.appendChild(component());
}

/**
 * 🛠️ The Viand "Surgeon"
 * (Basic version) Handles reactive list rendering.
 */
export function renderList(parent: HTMLElement, listSignal: any, itemTemplate: (item: any) => HTMLElement) {
  effect(() => {
    parent.innerHTML = ''; // Basic clear and redraw for now
    listSignal.value.forEach((item: any) => {
      parent.appendChild(itemTemplate(item));
    });
  });
}

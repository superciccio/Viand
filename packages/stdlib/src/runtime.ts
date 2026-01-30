import { effect as dom_effect, signal as dom_signal, computed as dom_computed, type ReadonlySignal } from "@preact/signals-core";

const isBrowser = typeof window !== 'undefined';

// --- POLYMORPHIC CORE ---
export const signal = isBrowser ? dom_signal : (val: any) => ({ value: val, peek: () => val });
export const computed = isBrowser ? dom_computed : (fn: () => any) => ({ value: fn(), peek: fn });
export const effect = isBrowser ? dom_effect : (fn: () => any) => {};

export function h(tag: string | Function, props: any = {}, children: any[] = [], ref: any = null, widget: any = null): any {
  return isBrowser ? h_dom(tag, props, children, ref, widget) : h_ssr(tag, props, children);
}

export function renderList(listSignal: any, itemTemplate: (item: any) => any, widget: any = null): any {
  return isBrowser ? renderList_dom(listSignal, itemTemplate, widget) : renderList_ssr(listSignal, itemTemplate);
}

export function renderMatch(exprSignal: any, cases: any[], defaultTemplate: any, widget: any = null): any {
  return isBrowser ? renderMatch_dom(exprSignal, cases, defaultTemplate, widget) : renderMatch_ssr(exprSignal, cases, defaultTemplate);
}

export function mount(target: any, component: () => any) {
  return isBrowser ? mount_dom(target, component) : component();
}

// --- DOM IMPLEMENTATION ---
function h_dom(tag: string | Function, props: any = {}, children: any[] = [], ref: any = null, widget: any = null): HTMLElement {
  if (typeof tag === 'function') {
      const res = tag(props);
      if (widget && res instanceof HTMLElement) (res as any).__viand = widget;
      if (typeof ref === 'function') ref(res);
      return res;
  }
  const el = document.createElement(tag);
  if (widget) (el as any).__viand = widget;
  if (typeof ref === 'function') ref(el);

  for (const [key, value] of Object.entries(props)) {
    if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.toLowerCase().slice(2), value as any);
    } 
    else if (key.startsWith('bind:')) {
        const prop = key.split(':')[1];
        const sig = value as any; 
        if (prop in el) (el as any)[prop] = sig.value;
        dom_effect(() => {
             if (document.activeElement !== el && (el as any)[prop] !== sig.value) {
                 (el as any)[prop] = sig.value;
             }
        });
        const eventName = (prop === 'value' || prop === 'checked') ? 'input' : 'change';
        el.addEventListener(eventName, () => {
             if (sig.peek() !== (el as any)[prop]) sig.value = (el as any)[prop];
        });
    }
    else if (key.startsWith('class:')) {
        const className = key.split(':')[1];
        dom_effect(() => {
            if ((value as any).value) el.classList.add(className);
            else el.classList.remove(className);
        });
    }
    else if (value && typeof value === 'object' && 'value' in value) {
      if (key.startsWith('on') || key.startsWith('bind:') || key.startsWith('class:')) continue;
      dom_effect(() => {
        if (key === 'class') {
            el.className = '';
            el.classList.add(...String((value as any).value).split(/\s+/).filter(c => c));
        }
        else if (key === 'text') el.textContent = (value as any).value;
        else (el as any)[key] = (value as any).value;
      });
    } 
    else {
      if (key.startsWith('on') || key.startsWith('bind:') || key.startsWith('class:')) continue;
      if (key === 'class') el.classList.add(...String(value).split(/\s+/).filter(c => c));
      else if (key === 'text') el.textContent = value as any;
      else (el as any)[key] = value;
    }
  }

  const addChildren = (c: any) => {
    if (Array.isArray(c)) c.forEach(addChildren);
    else if (c instanceof HTMLElement) el.appendChild(c);
    else if (c && typeof c === 'object' && 'value' in c) {
      const textNode = document.createTextNode("");
      dom_effect(() => { textNode.textContent = String((c as any).value); });
      el.appendChild(textNode);
    } else if (c !== undefined && c !== null && c !== "null") {
      el.appendChild(document.createTextNode(String(c)));
    }
  };
  addChildren(children);
  return el;
}

function renderList_dom(listSignal: any, itemTemplate: (item: any) => HTMLElement, widget: any = null) {
  const container = document.createElement('div');
  container.style.display = 'contents';
  if (widget) (container as any).__viand = widget;
  const elementMap = new Map<any, HTMLElement>();
  dom_effect(() => {
    const list = listSignal.value || [];
    const newElements: HTMLElement[] = [];
    const seen = new Set();
    list.forEach((item: any) => {
        seen.add(item);
        let el = elementMap.get(item);
        if (!el) { el = itemTemplate({ value: item }); elementMap.set(item, el); }
        newElements.push(el);
    });
    for (const item of elementMap.keys()) { if (!seen.has(item)) elementMap.delete(item); }
    container.replaceChildren(...newElements);
  });
  return container;
}

function renderMatch_dom(exprSignal: any, cases: any[], defaultTemplate: any, widget: any = null) {
  const container = document.createElement('div');
  container.style.display = 'contents';
  if (widget) (container as any).__viand = widget;
  let currentCondition: any = undefined;
  let currentElement: HTMLElement | null = null;
  dom_effect(() => {
    const val = exprSignal.value;
    if (val === currentCondition && currentElement) return;
    currentCondition = val;
    const match = cases.find(c => c.condition === val);
    const newElement = match ? match.template() : defaultTemplate();
    container.replaceChildren(newElement);
    currentElement = newElement;
  });
  return container;
}

function mount_dom(target: HTMLElement, component: () => HTMLElement) {
  target.innerHTML = '';
  target.appendChild(component());
}

// --- SSR IMPLEMENTATION ---
function h_ssr(tag: string | Function, props: any = {}, children: any[] = []): string {
  if (typeof tag === 'function') return tag(props);
  const attrs = Object.entries(props)
    .filter(([k]) => !k.startsWith('on') && !k.startsWith('bind:'))
    .map(([k, v]) => {
      const val = (v && typeof v === 'object' && 'value' in v) ? (v as any).value : v;
      if (k === 'class') return `class="${val}"`;
      if (k.startsWith('class:')) return val ? k.split(':')[1] : '';
      return `${k}="${val}"`;
    }).filter(a => a).join(' ');
  const flatChildren = flatten(children).map(c => (c && typeof c === 'object' && 'value' in c) ? String(c.value) : String(c)).join('');
  return `<${tag}${attrs ? ' ' + attrs : ''}>${flatChildren}</${tag}>`;
}

function renderList_ssr(listSignal: any, itemTemplate: (item: any) => string) {
  return (listSignal.value || []).map((item: any) => itemTemplate({ value: item })).join('');
}

function renderMatch_ssr(exprSignal: any, cases: any[], defaultTemplate: any) {
  const match = cases.find(c => c.condition === exprSignal.value);
  return match ? match.template() : defaultTemplate();
}

function flatten(arr: any[]): any[] {
  return arr.reduce((acc, val) => Array.isArray(val) ? acc.concat(flatten(val)) : acc.concat(val), []);
}

// --- GLOBAL EXPOSURE ---
if (typeof window !== 'undefined') {
  (window as any).viand = {
    inspect: (el: any) => (el && el.__viand) ? (console.log("🔍 Viand Widget Metadata:", el.__viand), el.__viand) : console.warn("⚠️ No Viand metadata found on this element."),
    bridge: {
        mocks: { api: {} as any, sql: {} as any },
        drivers: {
            api: (l: string, ...a: any[]) => (window as any).viand.bridge.mocks.api[l] || null,
            sql: (l: string, ...a: any[]) => (window as any).viand.bridge.mocks.sql[l] || []
        },
        api(l: string, ...a: any[]) { return this.drivers.api(l, ...a); },
        sql(l: string, ...a: any[]) { return this.drivers.sql(l, ...a); }
    },
    registerMock(t: 'api' | 'sql', l: string, d: any) { this.bridge.mocks[t][l] = d; },
    use(d: any) { if (d.api) this.bridge.drivers.api = d.api; if (d.sql) this.bridge.drivers.sql = d.sql; }
  };
}

export const api = (typeof window !== 'undefined') ? (window as any).viand.bridge : null;
export type { ReadonlySignal };
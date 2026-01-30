import { effect, signal, computed, type ReadonlySignal } from "@preact/signals-core";

export { signal, computed, effect };

type Props = Record<string, any>;
type Child = HTMLElement | string | ReadonlySignal<any> | Child[];

export function h(tag: string | Function, props: Props = {}, children: Child[] = [], ref: any = null, widget: any = null): HTMLElement {
  if (typeof tag === 'function') {
      const res = tag(props);
      if (widget && res instanceof HTMLElement) (res as any).__viand = widget;
      if (typeof ref === 'function') ref(res);
      return res;
  }
  
  const el = document.createElement(tag);
  if (widget) (el as any).__viand = widget;
  if (typeof ref === 'function') {
      ref(el);
  }

  for (const [key, value] of Object.entries(props)) {
    // Event Listeners
    if (key.startsWith('on') && typeof value === 'function') {
      const event = key.toLowerCase().slice(2);
      el.addEventListener(event, value);
    } 
    // Two-way Binding (bind:value, bind:checked)
    else if (key.startsWith('bind:')) {
        const prop = key.split(':')[1];
        const sig = value as any; 
        
        // Initial sync
        if (prop in el) (el as any)[prop] = sig.value;

        effect(() => {
             const val = sig.value;
             // Stability Guard: Only update if different AND not currently being edited
             if (document.activeElement !== el && (el as any)[prop] !== val) {
                 (el as any)[prop] = val;
             }
        });

        const eventName = (prop === 'value' || prop === 'checked') ? 'input' : 'change';
        el.addEventListener(eventName, () => {
             if (sig.peek() !== (el as any)[prop]) {
                 sig.value = (el as any)[prop];
             }
        });
    }
    // Conditional Classes (class:active)
    else if (key.startsWith('class:')) {
        const className = key.split(':')[1];
        if (value && typeof value === 'object' && 'value' in value) {
             effect(() => {
                 if (value.value) el.classList.add(className);
                 else el.classList.remove(className);
             });
        } else {
             if (value) el.classList.add(className);
             else el.classList.remove(className);
        }
    }
    // Reactive Attributes
    else if (value && typeof value === 'object' && 'value' in value) {
      if (key.startsWith('on') || key.startsWith('bind:') || key.startsWith('class:')) continue;
      effect(() => {
        if (key === 'class') {
            el.className = '';
            el.classList.add(...String(value.value).split(/\s+/).filter(c => c));
        }
        else if (key === 'text') el.textContent = value.value;
        else (el as any)[key] = value.value;
      });
    } 
    // Static Attributes
    else {
      if (key.startsWith('on') || key.startsWith('bind:') || key.startsWith('class:')) continue;
      if (key === 'class') {
          el.classList.add(...String(value).split(/\s+/).filter(c => c));
      }
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

export function renderList(listSignal: any, itemTemplate: (item: any) => HTMLElement, widget: any = null) {
  const container = document.createElement('div');
  container.style.display = 'contents';
  if (widget) (container as any).__viand = widget;
  const elementMap = new Map<any, HTMLElement>();

  effect(() => {
    const list = listSignal.value || [];
    const newElements: HTMLElement[] = [];
    const seen = new Set();
    
    list.forEach((item: any) => {
        seen.add(item);
        let el = elementMap.get(item);
        if (!el) {
            el = itemTemplate({ value: item });
            elementMap.set(item, el);
        }
        newElements.push(el);
    });

    // Cleanup stale elements
    for (const item of elementMap.keys()) {
        if (!seen.has(item)) elementMap.delete(item);
    }

    // Stable Reconciler
    container.replaceChildren(...newElements);
  });
  return container;
}

export function renderMatch(exprSignal: any, cases: { condition: any, template: () => HTMLElement }[], defaultTemplate: () => HTMLElement, widget: any = null) {
  const container = document.createElement('div');
  container.style.display = 'contents';
  if (widget) (container as any).__viand = widget;
  
  let currentCondition: any = undefined;
  let currentElement: HTMLElement | null = null;

  effect(() => {
    const val = exprSignal.value;
    // Stability Guard for components
    if (val === currentCondition && currentElement) return;
    currentCondition = val;

    const match = cases.find(c => c.condition === val);
    const newElement = match ? match.template() : defaultTemplate();
    
    container.replaceChildren(newElement);
    currentElement = newElement;
  });
  return container;
}

export function mount(target: HTMLElement, component: () => HTMLElement) {
  target.innerHTML = '';
  target.appendChild(component());
}

if (typeof window !== 'undefined') {
  (window as any).viand = {
    inspect: (el: any) => {
      if (el && el.__viand) {
        console.log("🔍 Viand Widget Metadata:", el.__viand);
        return el.__viand;
      }
      console.warn("⚠️ No Viand metadata found on this element.");
    },
    // The Sibling Bridge
    bridge: {
        mocks: {
            api: {} as Record<string, any>,
            sql: {} as Record<string, any>
        },
        drivers: {
            api: (label: string, ...args: any[]) => {
                const mock = (window as any).viand.bridge.mocks.api[label];
                if (typeof mock !== 'undefined') return mock;
                console.warn(`[Viand Bridge] No API driver or mock set for: ${label}`, args);
                return null;
            },
            sql: (label: string, ...args: any[]) => {
                const mock = (window as any).viand.bridge.mocks.sql[label];
                if (typeof mock !== 'undefined') return mock;
                console.warn(`[Viand Bridge] No SQL driver or mock set for: ${label}`, args);
                return [];
            }
        },
        api(label: string, ...args: any[]) { return this.drivers.api(label, ...args); },
        sql(label: string, ...args: any[]) { return this.drivers.sql(label, ...args); }
    },
    registerMock(type: 'api' | 'sql', label: string, data: any) {
        this.bridge.mocks[type][label] = data;
    },
    use(drivers: { api?: Function, sql?: Function }) {
        if (drivers.api) this.bridge.drivers.api = drivers.api as any;
        if (drivers.sql) this.bridge.drivers.sql = drivers.sql as any;
    }
  };
}

// For compiler compatibility
export const api = (typeof window !== 'undefined') ? (window as any).viand.bridge : null;

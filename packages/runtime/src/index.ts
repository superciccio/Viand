import { effect, signal, computed, type ReadonlySignal } from "@preact/signals-core";

export { signal, computed, effect };

type Props = Record<string, any>;
type Child = HTMLElement | string | ReadonlySignal<any> | Child[];

export function h(tag: string | Function, props: Props = {}, children: Child[] = [], ref: any = null, widget: any = null): HTMLElement {
  if (typeof tag === 'function') {
      return tag(props);
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
        
        if (prop in el) {
            (el as any)[prop] = sig.value;
        }

        effect(() => {
             if ((el as any)[prop] !== sig.value) {
                 (el as any)[prop] = sig.value;
             }
        });

        const eventName = (prop === 'value' || prop === 'checked') ? 'input' : 'change';
        el.addEventListener(eventName, () => {
             sig.value = (el as any)[prop];
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
    
    list.forEach((item: any) => {
        let el = elementMap.get(item);
        if (!el) {
            el = itemTemplate({ value: item });
            elementMap.set(item, el);
        }
        newElements.push(el);
    });

    container.innerHTML = '';
    newElements.forEach(el => container.appendChild(el));
  });
  return container;
}

export function renderMatch(exprSignal: any, cases: { condition: any, template: () => HTMLElement }[], defaultTemplate: () => HTMLElement, widget: any = null) {
  const container = document.createElement('div');
  container.style.display = 'contents';
  if (widget) (container as any).__viand = widget;
  effect(() => {
    container.innerHTML = '';
    const val = exprSignal.value;
    const match = cases.find(c => c.condition === val);
    if (match) {
      container.appendChild(match.template());
    } else {
      container.appendChild(defaultTemplate());
    }
  });
  return container;
}

export function mount(target: HTMLElement, component: () => HTMLElement) {
  target.innerHTML = '';
  target.appendChild(component());
}

export const api = {
  getAnalytics: () => ({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    data: [12, 19, 3, 5, 2]
  })
};

if (typeof window !== 'undefined') {
  (window as any).viand = {
    inspect: (el: any) => {
      if (el && el.__viand) {
        console.log("🔍 Viand Widget Metadata:", el.__viand);
        return el.__viand;
      }
      console.warn("⚠️ No Viand metadata found on this element.");
    }
  };
}

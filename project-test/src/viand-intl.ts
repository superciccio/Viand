/**
 * 🌍 Viand Standard Intl Interface
 * Reactive internationalization using Signals.
 */

import { signal, effect } from "@viand/runtime";

function createIntl() {
  const isBrowser = typeof window !== 'undefined';
  const detectedLocale = isBrowser ? navigator.language.split('-')[0] : 'en';
  
  const _locale = signal(detectedLocale);
  const _dict = signal<Record<string, string>>({});
  
  // The Full Registry (Non-reactive to keep memory footprint low)
  const _fullRegistry: Record<string, Record<string, string>> = {};

  const _activate = (lang: string) => {
    const activeDict: Record<string, string> = {};
    Object.entries(_fullRegistry).forEach(([key, values]) => {
        activeDict[key] = values[lang] || values['en'] || key;
    });
    _dict.value = activeDict;
  };

  // Automatically re-activate when locale changes
  effect(() => {
    _activate(_locale.value);
  });

  return {
    get locale() { return _locale.value; },
    set locale(v) { _locale.value = v; },
    get localeSignal() { return _locale; },

    load(data: Record<string, Record<string, string>>) {
      Object.assign(_fullRegistry, data);
      _activate(_locale.value);
    },

    t(key: string) {
      return _dict.value[key] || key;
    },

    date(val: string | Date, options = {}) {
      const d = typeof val === 'string' ? new Date(val) : val;
      return new Intl.DateTimeFormat(_locale.value, options).format(d);
    },

    currency(val: number, currency = 'USD') {
      return new Intl.NumberFormat(_locale.value, { style: 'currency', currency }).format(val);
    }
  };
}

export const intl = createIntl();

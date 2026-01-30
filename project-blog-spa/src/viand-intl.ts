/**
 * 🌍 Viand Standard Intl Interface
 * Reactive internationalization using Signals.
 */

import { signal } from "@viand/runtime";

function createIntl() {
  const _locale = signal('en');
  const _dict = signal<Record<string, Record<string, string>>>({});

  return {
    get locale() { return _locale.value; },
    set locale(v) { _locale.value = v; },
    get localeSignal() { return _locale; },

    load(data: Record<string, Record<string, string>>) {
      _dict.value = { ..._dict.value, ...data };
    },

    t(key: string) {
      const dict = _dict.value;
      const entry = dict[key];
      if (!entry) return key;
      return entry[_locale.value] || entry['en'] || key;
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

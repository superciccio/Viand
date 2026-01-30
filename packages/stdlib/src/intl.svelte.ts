/**
 * 🌍 Viand Standard Intl Interface
 * Reactive internationalization using Svelte Stores.
 */

import { writable, get } from "svelte/store";

function createIntl() {
  const _locale = writable('en');
  const _dict = writable({});

  return {
    // Svelte Store Compatibility
    subscribe: _locale.subscribe,

    get locale() { return get(_locale); },
    set locale(v) { _locale.set(v); },

    load(data) {
      _dict.update(d => ({ ...d, ...data }));
    },

    t(key) {
      const locale = get(_locale);
      const dict = get(_dict);
      const entry = dict[key];
      if (!entry) return key;
      return entry[locale] || entry['en'] || key;
    },

    date(val, options = {}) {
      const d = typeof val === 'string' ? new Date(val) : val;
      return new Intl.DateTimeFormat(get(_locale), options).format(d);
    },

    currency(val, currency = 'USD') {
      return new Intl.NumberFormat(get(_locale), { style: 'currency', currency }).format(val);
    }
  };
}

export const intl = createIntl();

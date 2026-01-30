/**
 * 🌍 Viand Standard Intl Interface
 * Reactive internationalization and formatting.
 */

function createIntl() {
  let locale = $state('en');
  let _dict = $state({});

  return {
    get locale() { return locale; },
    set locale(v) { locale = v; },

    load(data) {
      _dict = { ..._dict, ...data };
    },

    t(key) {
      const entry = _dict[key];
      if (!entry) return key;
      return entry[locale] || entry['en'] || key;
    },

    date(val, options = {}) {
      const d = typeof val === 'string' ? new Date(val) : val;
      return new Intl.DateTimeFormat(locale, options).format(d);
    },

    currency(val, currency = 'USD') {
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(val);
    }
  };
}

export const intl = createIntl();
/**
 * 🌍 Viand Standard Intl Interface
 * Reactive internationalization and formatting.
 */

class IntlService {
  // Current locale state (Default to English)
  locale = 'en';
  
  // The global dictionary (Merged from all components)
  dict = {};

  /**
   * Merge new translations into the global dictionary.
   */
  load(data) {
    this.dict = { ...this.dict, ...data };
  }

  /**
   * Translate a key based on the current locale.
   */
  t(key) {
    const entry = this.dict[key];
    if (!entry) return key;
    return entry[this.locale] || entry['en'] || key;
  }

  date(val, options = {}) {
    const d = typeof val === 'string' ? new Date(val) : val;
    return new Intl.DateTimeFormat(this.locale, options).format(d);
  }

  currency(val, currency = 'USD') {
    return new Intl.NumberFormat(this.locale, { style: 'currency', currency }).format(val);
  }
}

// Export a singleton instance
export const intl = new IntlService();
# 🌍 Viand i18n Strategy: Going Truly Global

While `intl` handles the mechanics of translation and formatting, a complete **i18n (Internationalization)** strategy ensures that the entire framework is aware of cultural and regional differences. To compete with Next.js and SvelteKit, Viand needs a deeply integrated i18n layer.

## 1. 🔢 Smart Pluralization
Current `t(key)` is a 1:1 lookup. Real applications need pluralization rules (which vary significantly across languages like Arabic or Russian).
- **Proposed:** `t('items', { count: 2 })`
- **Implementation:** Integration with `Intl.PluralRules` to select the correct key suffix (e.g., `items:zero`, `items:one`, `items:other`).

## 2. 📍 Localized Routing (The SEO Pillar)
Next.js excels at this. Viand should automate the URL-to-Locale mapping.
- **Subpath Routing:** `example.com/en/about` vs `example.com/it/about`.
- **Domain Routing:** `example.com` vs `example.it`.
- **Hreflang Automation:** The `head:` block should automatically inject alternate links:
  ```html
  <link rel="alternate" hreflang="it" href="/it/about">
  ```

## 3. ⏳ Relative Time & Units
Beyond simple dates, users expect "human" time.
- **Relative Time:** `intl.relative(date)` → "5 minutes ago".
- **Unit Conversion:** `intl.unit(100, 'mile-per-hour')` → "160 km/h" based on locale.

## 📐 4. RTL (Right-to-Left) Infrastructure
Supporting Arabic, Hebrew, or Persian requires more than translated text.
- **Direction Injection:** The framework should automatically set `<html dir="rtl">` when an RTL locale is active.
- **Logical CSS Properties:** Encourage or auto-convert `padding-left` to `padding-inline-start` in the `style:` block to make layouts flip automatically.

## 📦 5. Lazy Dictionary Loading (Performance)
Loading every language in a single bundle is wasteful.
- **Sidecar Fetching:** When `intl.locale` changes, the CLI/Runtime should automatically fetch the corresponding `.lang` JSON from the server.
- **SSR Coordination:** The `bake` command should generate pre-rendered pages for *every* supported language in their respective subdirectories.

## 🛠️ 6. The Developer Experience (DX)
- **Missing Key Detection:** The compiler should warn if a key used in `view:` is missing from a `.lang` sibling.
- **Visual Translation:** A "Ghost Mode" overlay that allows translating strings directly in the browser and saving them back to the `.lang` file.

## 🏁 Summary
**Intl** is a library; **i18n** is a first-class framework citizen. By integrating these features into the core compilation and baking pipeline, Viand becomes a viable choice for global enterprises, not just local prototypes.

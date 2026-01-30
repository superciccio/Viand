# 🗺️ Viand 2.0: The Master Roadmap

This document serves as the single source of truth for Viand's evolution. It prioritizes the "Giant Killer" strategies defined in our documentation.

## 🏁 Completed Foundation
- [x] **Signal Core:** Atomic reactivity via `@preact/signals-core`.
- [x] **Ghost Mode Stage 1:** Compilation of `.viand` to Signal-wrapped JS.
- [x] **Initial SSR:** Successful `bake --ssr` command and Style collection.
- [x] **Head Management:** Declarative `head:` blocks for SEO/Meta.

---

## 🔥 Current Priority: The Iron Fortress (Stability & DX)
**Goal:** Make Viand professional, safe, and deployable.

- [ ] **Nitro Integration:** Replace custom bake with a full Nitro server engine.
- [ ] **The `spread:` Keyword:** Implement attribute spreading for headless UI support.
- [ ] **Gradual Typing:** Add `strict: true` and basic type enforcement (@prop name: string).
- [ ] **LSP Alpha:** Basic workspace indexer for Sibling-aware autocomplete.

---

## 🚀 Phase 6: The Oracle (AI & i18n)
**Goal:** First-class intelligence and global reach.

- [ ] **`.ai` Sibling:** Declarative prompt management and secure server execution.
- [ ] **i18n Infrastructure:** Localized routing (`/en/`, `/it/`) and pluralization.
- [ ] **SWR Pattern:** Native "Stale-While-Rehydrate" primitives for data signals.

---

## 🎨 Phase 7: The Pantry (Component Ecosystem)
**Goal:** "Instant beautiful" for rapid development.

- [ ] **Ark UI Bridge:** Official headless primitives (Tabs, Menu, Dialog).
- [ ] **`viand add pantry`:** Component-level dependency installer.
- [ ] **Tailwind Integration:** Built-in support for Preline/Flowbite patterns.

---

## 📱 Phase 8: The Native Frontier (Tauri 2.0)
**Goal:** Cross-platform dominance.

- [ ] **`system:` Block:** Direct Rust-side hardware access (Mobile/Desktop).
- [ ] **Mobile Presets:** Automated build/deploy for iOS and Android.
- [ ] **Universal Build:** `viand bake --native`.

---

## 🧠 Phase 9: The Summit (Optimization & Community)
**Goal:** Efficiency and scale.

- [ ] **LIS Reconciliation:** Production-grade list diffing.
- [ ] **Viand Playground:** Wasm-based online IDE for community onboarding.
- [ ] **The `.policy` Sibling:** Declarative security layer for Nitro execution.

---

## 📚 Strategic References
- [Future Vision](docs/future-vision.md)
- [Nitro Proposal](docs/cli-nitro-proposal.md)
- [LSP Vision](docs/lsp-grand-vision.md)
- [i18n Strategy](docs/i18n-strategy.md)
- [AI Sibling](docs/ai-sibling-strategy.md)
- [UI Pantry](docs/ui-pantry-strategy.md)
- [Strict Typing](docs/strict-typing-strategy.md)
- [Serverless & Mobile](docs/serverless-and-mobile.md)

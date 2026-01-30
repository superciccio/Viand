# 🏁 Viand: The Signal Era Roadmap

This roadmap tracks the development of the **Viand Standalone Engine**, moving away from Svelte and toward a purely reactive, signal-based foundation.

## 🔱 Phase 1: The Foundry (Core Engine) [COMPLETED]
- [x] **Tiny Runtime:** Establish the `@preact/signals-core` bridge.
- [x] **Atomic Renderer:** Compile Viand to pure JS factory functions.
- [x] **DOM Painter:** Implement fine-grained `bind()` and `renderList()`.
- [x] **Event Glue:** Declarative event listeners without the overhead.

## 🔱 Phase 2: The Sibling Bridge [COMPLETED]
- [x] **Automated Mocks:** Inject `mock:` data from `.api` files into components.
- [x] **Pluggable Drivers:** Define `viand.use()` to swap between Web, Mock, and Tauri.
- [x] **Ref Signals:** Element references (#ref) that trigger reactive effects.

## 🔱 Phase 3: The Architecture [COMPLETED]
- [x] **Composition:** Support for `slot` and `children` prop passing.
- [x] **Executive Router:** Standalone Signals-based SPA router.
- [x] **Memory Pillar:** Module-based reactive singletons (getters/setters).

## 🔱 Phase 4: The Oven (SSR) [COMPLETED]
- [x] **Static Generation:** `bake --ssr` command for pre-rendering HTML.
- [x] **Style Collection:** SSR-compatible style mapping to avoid FOUC.
- [x] **Hydration:** handoff between static HTML and reactive Signals.

## 🔱 Phase 5: The Lens (DX)
- [x] **Head Management:** Declarative `head:` block for SEO and metadata.
- [ ] **Ghost Mode:** 100% In-memory transformation in Vite.
- [ ] **Source Maps:** 1:1 error mapping to `.viand` source.
- [ ] **LSP Support:** Intelligent IDE features for the new foundation.
- [ ] **Strict Mode:** Implementation of `strict: true` for mandatory Prop/State typing.

## 🔱 Phase 6: The Summit (Optimization)
- [ ] **High-Efficiency Reconciliation:** Replace the naive `renderList` with a production-grade diffing algorithm (Longest Increasing Subsequence).
- [ ] **Widget Map Recycling:** Use the `ViandWidget` tree to recycle DOM nodes across re-renders for maximum performance.
- [ ] **Memory Hygiene:** Implement automatic cleanup/unsubscribing for effects and signal listeners.

## 🔱 Phase 7: The Native Frontier (Tauri Desktop & Mobile)
- [ ] **Native Sidecars:** Declarative bridge logic for Rust-based system commands.
- [ ] **Mobile Hardware Access:** Native camera, GPS, and sensor integration via `system:` block.
- [ ] **System Signals:** Bind UI state to native OS events (battery, window focus, file system).
- [ ] **Unified Build:** `viand bake --native` to produce cross-platform binaries.

## 🔱 Phase 8: The Oracle (AI Siblings)
- [ ] **`.ai` Sibling support:** Declarative prompts managed by the compiler.
- [ ] **Prompt Engineering DX:** Compile-time validation of LLM contexts.
- [ ] **Isomorphic AI Bridge:** Automated Nitro routes for prompt execution.

## 🔱 Phase 9: The Pantry (UI Ecosystem)
- [ ] **Headless Glue:** Integration with **Ark UI** or **Radix UI** primitives.
- [ ] **Tailwind Snippets:** Built-in support for Preline/Flowbite patterns.
- [ ] **`viand add pantry`:** Component-level dependency manager.


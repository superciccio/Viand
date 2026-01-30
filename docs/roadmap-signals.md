# 🏁 Viand: The Signal Era Roadmap

This roadmap tracks the development of the **Viand Standalone Engine**, moving away from Svelte and toward a purely reactive, signal-based foundation.

## 🔱 Phase 1: The Foundry (Core Engine) [COMPLETED]
- [x] **Tiny Runtime:** Establish the `@preact/signals-core` bridge.
- [x] **Atomic Renderer:** Compile Viand to pure JS factory functions.
- [x] **DOM Painter:** Implement fine-grained `bind()` and `renderList()`.
- [x] **Event Glue:** Declarative event listeners without the overhead.

## 🔱 Phase 2: The Sibling Bridge
- [ ] **SQL Ingestion:** Automatic embedding of `.sql` queries.
- [ ] **API Ingestion:** Built-in HTTP proxying with mocking.
- [ ] **Intl Ingestion:** Sibling-based multi-lingual support.

## 🔱 Phase 3: The Architecture
- [ ] **Composition:** Slots and Snippets for complex UIs.
- [ ] **Executive Router:** Reactive path tracking for SPAs.
- [ ] **Memory Pillar:** Global reactive singletons.

## 🔱 Phase 4: The Oven (SSR)
- [ ] **String Mode:** Non-DOM renderer for server-side HTML.
- [ ] **Hydration:** Handshake protocol to wake up static pages.

## 🔱 Phase 5: The Lens (DX)
- [ ] **Ghost Mode:** 100% In-memory transformation in Vite.
- [ ] **Source Maps:** 1:1 error mapping to `.viand` source.
- [ ] **LSP Support:** Intelligent IDE features for the new foundation.

## 🔱 Phase 6: The Summit (Optimization)
- [ ] **High-Efficiency Reconciliation:** Replace the naive `renderList` with a production-grade diffing algorithm (Longest Increasing Subsequence).
- [ ] **Widget Map Recycling:** Use the `ViandWidget` tree to recycle DOM nodes across re-renders for maximum performance.
- [ ] **Memory Hygiene:** Implement automatic cleanup/unsubscribing for effects and signal listeners.


# 🗺️ Viand Language Roadmap

This document tracks the strategic development milestones for the Viand language, moving from a UI prototype to a **Full-Stack Native Application DSL.**

## 🛡️ Core Design Philosophy (PITA Prevention)
Viand is built to surgically remove the friction found in modern frameworks (Next.js, SvelteKit, Astro):
1. **Isomorphism by Keyword:** No `'use client'`/`'use server'`. Use `component` vs `server`.
2. **The Sibling Pattern:** No `+page.server.ts` scavenger hunts. Use `Home.viand`, `Home.sql`, `Home.api`.
3. **Ghost Mode Tooling:** The developer only authors `.viand`. The compiler handles the "Ghost Code" (Svelte/JS/SQL Bridge).
4. **Declarative Interop:** Use `sync`, `on change`, and `raw` to bridge the gap to third-party JS libraries safely.

---

## 🚩 Milestone 0: Architecture Refactor (The "Object-way") [COMPLETED]
- [x] **Component Manifest:** Structured JS object IR.
- [x] **Recursive Renderer:** Reliable Svelte 5 generation.
- [x] **Svelte 5 Runes:** Target `$state`, `$derived`, and `$props`.

## 🚩 Milestone 1-4: Language Core [COMPLETED]
- [x] **Control Flow:** `each`, `if/else`, and `match`.
- [x] **Reactivity:** The `sync` and `on change` keywords.
- [x] **Bindings & Events:** Generic `bind:` and event modifiers.
- [x] **Viand-Native CSS:** Indentation-based styling.

## 🚩 Milestone 5: The "Steel" Foundation (Hardening) [PARTIALLY COMPLETED]
- [x] **Modular Compiler:** Refactored into `parser` and specialized `renderers` (Svelte/Logic/Test/Static).
- [x] **Acorn Integration:** Real JS parsing for logic and expressions.
- [x] **Vite Plugin:** Native `.viand` support (in-memory compilation).
- [x] **TypeScript Refactor:** Port the compiler to TS.
- [ ] **Error Resilience:** Smarter error messages with source-line indicators.

## 🚩 Milestone 5.2: Integrated Native Testing [COMPLETED]
- [x] **`test` Block:** Root-level container for test suites.
- [x] **`must` Keyword:** Clean assertion syntax (e.g., `must find "button"`).
- [x] **Brain-Body-Critic Architecture:** Shared reactive logic (.svelte.ts) for View and Test.
- [x] **@logic Persona:** In-memory state testing via mirrored classes.
- [x] **@ui Persona:** Headless DOM verification (Vitest + JSDOM).
- [x] **Smoke Testing:** `viand verify` for automated health checks.

## 🚩 Milestone 6: Sibling Resource Awareness [COMPLETED]
- [x] **SQL Sibling Scanning:** Look for `.sql` files matching component names.
- [x] **Query Labeling:** Parse `-- label: name` markers in SQL files.
- [x] **Resource Injection:** Make `sql.labelName()` available inside Viand functions.

## 🚩 Milestone 7: Advanced Composition (The Shell Pillar) [COMPLETED]
- [x] **`slot:` keyword:** Support for Svelte 5 snippets and slots.
- [x] **Auto-Snippets:** Indented children automatically wrapped in snippets.
- [x] **UI as Props:** Passing Viand view-nodes into child components.

## 🚩 Milestone 8: Global State (The Memory Pillar) [COMPLETED]
- [x] **`memory` keyword:** Define shared reactive singletons.
- [x] **Shared Brains:** Triple-file architecture ensuring 1:1 logic parity.
- [x] **Smart Interpolation:** Automatic evaluation of global namespaces in views.

## 🚩 Milestone 9: Executive Routing (The Navigation Pillar) [COMPLETED]
- [x] **`match router.path` logic:** A high-level declarative router syntax.
- [x] **`router.goto()` action:** Built-in navigation primitive.

## 🚩 Milestone 10: Static HTML Generation (The SSG Pillar) [COMPLETED]
- [x] **Zero-HTML Entry:** Generate full `index.html` documents directly from `.viand` files.
- [x] **Executive Build:** `viand bake` produces a static `dist/` folder ready for deployment.

## 🚩 Milestone 14: JS Interoperability (The Bridge Pillar) [COMPLETED]
- [x] **`#ref` Shorthand:** Automatic DOM element binding (e.g., `div #myRef:`).
- [x] **`on mount:` block:** Dedicated lifecycle logic for library initialization.
- [x] **NPM Import Support:** Support for named and default imports from `node_modules`.
- [x] **`raw` Keyword:** Bulletproof state snapshots for non-reactive libraries.

## 🚩 Milestone 15: The API Pillar (HTTP Siblings) [COMPLETED]
- [x] **`.api` Sibling Scanning:** Detect and parse component-matched HTTP definitions.
- [x] **Declarative HTTP Logic:** Define headers, query, and mock using Viand indentation.
- [x] **Dual-Mode Bridge:** Support for real fetch (with base URL overrides) and mocking in logic.

## 🚩 Milestone 17: Developer Experience (The Lens Pillar) [PARTIALLY COMPLETED]
- [x] **LSP Foundation:** Standalone Language Server using the official LSP protocol.
- [ ] **LSP Hardening:** Bundle server into VS Code extension for VSIX compatibility.
- [x] **Executive Formatting:** Automated indentation and syntax cleanup.
- [x] **Executive JSDoc:** Integrated Hover documentation for core keywords.

## 🚩 Milestone 18: Strategic Hardening (The Iron Fortress)
**Goal:** Transition from prototype to reliable production toolkit.
- [ ] **Source Maps:** Implement 1:1 error mapping from Browser -> `.viand` source.
- [ ] **`viand create`:** Robust project scaffolder (SPA/MPA/Tauri).
- [ ] **Validation Pass:** Catch undefined variables/functions during compilation.
- [ ] **Pantry Growth:** Standard modules for `use auth`, `use storage`, and `use meta`.

## 🚩 Milestone 11: The Tauri Auto-Bridge (The Native Monster)
...

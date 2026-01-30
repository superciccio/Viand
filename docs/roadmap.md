# 🗺️ Viand Language Roadmap

This document tracks the strategic development milestones for the Viand language, moving from a UI prototype to a **Full-Stack Native Application DSL.**

## 🚩 Milestone 0: Architecture Refactor (The "Object-way") [COMPLETED]
- [x] **Component Manifest:** Structured JS object IR.
- [x] **Recursive Renderer:** Reliable Svelte 5 generation.
- [x] **Svelte 5 Runes:** Target `$state`, `$derived`, and `$props`.

## 🚩 Milestone 1-4: Language Core [COMPLETED]
- [x] **Control Flow:** `each`, `if/else`, and `match`.
- [x] **Reactivity:** The `sync` keyword.
- [x] **Bindings & Events:** Generic `bind:` and event modifiers.
- [x] **Viand-Native CSS:** Indentation-based styling.

## 🚩 Milestone 5: The "Steel" Foundation (Hardening) [PARTIALLY COMPLETED]
- [x] **Modular Compiler:** Refactored into `parser` and specialized `renderers` (Svelte/Logic/Test/Static).
- [x] **Acorn Integration:** Real JS parsing for logic and expressions.
- [x] **Vite Plugin:** Native `.viand` support (in-memory compilation).
- [x] **TypeScript Refactor:** Port the compiler to TS.
- [ ] **Compiler Validation:** Catch logic errors during IR build.
- [x] **Error Mapping:** Source Map support for browser debugging.

## 🚩 Milestone 5.2: Integrated Native Testing [COMPLETED]
- [x] **`test` Block:** Root-level container for test suites.
- [x] **`must` Keyword:** Clean assertion syntax (e.g., `must find "button"`).
- [x] **Brain-Body-Critic Architecture:** Shared reactive logic (.svelte.ts) for View and Test.
- [x] **@logic Persona:** In-memory state testing via mirrored classes.
- [x] **@ui Persona:** Headless DOM verification (Vitest + JSDOM).
- [ ] **@integration Persona:** Facade-based dependency mocking.

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

## 🚩 Milestone 9: Executive Routing (The Navigation Pillar)
**Goal:** Build multi-page SPAs and Blogs natively.
- [ ] **`page-router` block:** A high-level declarative router syntax.
- [ ] **`goto()` action:** Built-in navigation primitive.

## 🚩 Milestone 10: Static HTML Generation (The SSG Pillar) [COMPLETED]
**Goal:** Turn Viand into a Page-First DSL (Jekyll/Hugo style).
- [x] **Zero-HTML Entry:** Generate full `index.html` documents directly from `.viand` files.
- [x] **Executive Build:** `viand bake` produces a static `dist/` folder ready for deployment.

## 🚩 Milestone 11: The Tauri Auto-Bridge (The Native Monster)
**Goal:** Automate the Native/Web boundary.
- [ ] **Zero-Rust Commands:** Generate Tauri Rust commands automatically based on SQL labels.
- [ ] **Auto-Invoke:** Generate the `invoke()` calls in the generated logic.
- [ ] **Native Plugin:** A Viand-Tauri plugin to handle generic data execution.

## 🚩 Milestone 12: The Meta-Framework (@viand/framework)
- [ ] **Single Dependency:** Wrap Vite, Svelte, and Tauri into one toolkit.
- [ ] **CLI Scaffolding:** `viand create` for full-stack native apps.

## 🚩 Milestone 13: Partial Hydration (The Island Pillar)
...

## 🚩 Milestone 14: JS Interoperability (The Bridge Pillar) [COMPLETED]
- [x] **`#ref` Shorthand:** Automatic DOM element binding (e.g., `div #myRef:`).
- [x] **`on mount:` block:** Dedicated lifecycle logic for library initialization.
- [x] **NPM Import Support:** Support for named and default imports from `node_modules`.

## 🚩 Milestone 15: The API Pillar (HTTP Siblings)
**Goal:** Clean, declarative HTTP communication with full testability.
- [ ] **`.api` Sibling Scanning:** Detect and parse component-matched HTTP definitions.
- [ ] **Declarative HTTP Logic:** Define headers, query, and body using Viand indentation.
- [ ] **Dual-Mode Bridge:** Support for real fetch (with base URL overrides) and mocking in tests.

## 🚩 Milestone 16: Markdown Integration (The Content Pillar)
...
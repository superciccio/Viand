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

## 🚩 Milestone 9: Executive Routing (The Navigation Pillar) [COMPLETED]
**Goal:** Build multi-page SPAs and Blogs natively.
- [x] **`match router.path` logic:** A high-level declarative router syntax.
- [x] **`router.goto()` action:** Built-in navigation primitive.

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

## 🚩 Milestone 15: The API Pillar (HTTP Siblings) [COMPLETED]
**Goal:** Clean, declarative HTTP communication with full testability.
- [x] **`.api` Sibling Scanning:** Detect and parse component-matched HTTP definitions.
- [x] **Declarative HTTP Logic:** Define headers, query, and mock using Viand indentation.
- [x] **Dual-Mode Bridge:** Support for real fetch (with base URL overrides) and mocking in logic.

## 🚩 Milestone 16: Markdown Integration (The Content Pillar)
**Goal:** Allow authoring content in pure Markdown inside Viand.
- [ ] **`markdown:` block:** Support for standard MD with component embedding.
- [ ] **Frontmatter Awareness:** Parse page metadata natively.

## 🚩 Milestone 17: Developer Experience (The Lens Pillar)
**Goal:** Professional IDE support for the Viand language.
- [x] **LSP Foundation:** Standalone Language Server using the official LSP protocol.
- [ ] **LSP Connectivity Fix:** Bundle the server code into the VS Code extension for VSIX compatibility.
- [ ] **Live Diagnostics:** Real-time syntax and indentation error reporting in the editor.
- [ ] **Hover & Autocomplete:** Show symbol definitions and documentation (Verify Protocol).
- [ ] **Executive Formatting:** Automated indentation and syntax cleanup.
- [ ] **Branding:** Properly register the 🌿 icon via File Icon Themes.

## 🚩 Milestone 18: Strategic Hardening (The Iron Fortress)
...

## 🚩 Milestone 19: The Standard Library (The Pantry)
**Goal:** Zero-setup modules for common production requirements.
- [ ] **`use intl`**: Reactive translations, date/currency formatting.
- [ ] **`use storage`**: Persistent reactive state (LocalStorage/SQLite).
- [ ] **`use auth`**: Session management and route guarding.
- [ ] **`use notify`**: Unified browser/native notification system.
- [ ] **`use theme`**: Dark mode and system preference management.

## 🚩 Milestone 20: Universal Runtime (Browser Parity)
...
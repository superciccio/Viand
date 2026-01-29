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
- [x] **Acorn Integration:** Real JS parsing for logic and expressions.
- [x] **Vite Plugin:** Native `.viand` support (in-memory compilation).
- [x] **TypeScript Refactor:** Port the compiler to TS.
- [ ] **Compiler Validation:** Catch logic errors during IR build.
- [x] **Error Mapping:** Source Map support for browser debugging.

## 🚩 Milestone 5.2: Integrated Native Testing [PARTIALLY COMPLETED]
- [x] **`test` Block:** Root-level container for test suites.
- [x] **`must` Keyword:** Clean assertion syntax (e.g., `must $count == 1`).
- [x] **Brain-Body-Critic Architecture:** Shared reactive logic (.svelte.ts).
- [x] **@logic Persona:** In-memory state testing via mirrored classes.
- [ ] **@ui Persona:** Headless DOM verification.
- [ ] **@integration Persona:** Facade-based dependency mocking.

## 🚩 Milestone 6: Sibling Resource Awareness [PARTIALLY COMPLETED]
- [x] **SQL Sibling Scanning:** Look for `.sql` files matching component names.
- [x] **Query Labeling:** Parse `-- label: name` markers in SQL files.
- [x] **Resource Injection:** Make `sql.labelName()` available inside Viand functions.

## 🚩 Milestone 7: Advanced Composition (The Shell Pillar)
**Goal:** Enable reusable layouts and UI injection.
- [ ] **`slot:` keyword:** Support for Svelte 5 snippets and slots.
- [ ] **UI as Props:** Ability to pass Viand view-nodes into child components.

## 🚩 Milestone 8: Global State (The Memory Pillar)
**Goal:** Share data across components without prop-drilling.
- [ ] **`global` keyword:** Define state that is accessible throughout the project.
- [ ] **Shared Brains:** Components can import logic from other `.viand` logic files.

## 🚩 Milestone 9: Executive Routing (The Navigation Pillar)
**Goal:** Build multi-page SPAs and Blogs natively.
- [ ] **`page-router` block:** A high-level declarative router syntax.
- [ ] **`goto()` action:** Built-in navigation primitive.

## 🚩 Milestone 10: The Tauri Auto-Bridge (The Native Monster)
**Goal:** Automate the Native/Web boundary.
- [ ] **Zero-Rust Commands:** Generate Tauri Rust commands automatically based on SQL labels.
- [ ] **Auto-Invoke:** Generate the `invoke()` calls in the generated logic.
- [ ] **Native Plugin:** A Viand-Tauri plugin to handle generic data execution.

## 🚩 Milestone 11: Universal Runtime (Browser Parity)
- [ ] **Browser SQL Engine:** Provide WASM-SQLite for 1:1 SQL parity in the browser.
- [ ] **Viand Dev Tools:** A dashboard to inspect Manifest and Native Bridge state.

## 🚩 Milestone 12: The Meta-Framework (@viand/framework)
- [ ] **Single Dependency:** Wrap Vite, Svelte, and Tauri into one toolkit.
- [ ] **CLI Scaffolding:** `viand create` for full-stack native apps.
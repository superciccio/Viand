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

## 🚩 Milestone 5: The "Steel" Foundation (Hardening)
**Goal:** Professional-grade stability and developer experience.
- [x] **Acorn Integration:** Real JS parsing for logic and expressions.
- [x] **Vite Plugin:** Native `.viand` support (in-memory compilation).
- [x] **TypeScript Refactor:** Port the compiler to TS.
- [ ] **Error Mapping:** Map Svelte errors back to Viand line numbers.

## 🚩 Milestone 6: Sibling Resource Awareness (The "Dream" Logic)
**Goal:** Allow Viand to "swallow" external logic files.
- [ ] **SQL Sibling Scanning:** Look for `.sql` files matching component names.
- [ ] **Query Labeling:** Parse `-- label: name` markers in SQL files.
- [ ] **Resource Injection:** Make `sql.labelName()` available inside Viand functions.

## 🚩 Milestone 7: The Tauri Auto-Bridge
**Goal:** Automate the Native/Web boundary.
- [ ] **Zero-Rust Commands:** Generate Tauri Rust commands automatically based on SQL labels.
- [ ] **Auto-Invoke:** Generate the `invoke()` calls in the Svelte script block.
- [ ] **Plugin Infrastructure:** A Viand-Tauri plugin to handle generic data execution.

## 🚩 Milestone 8: Local-First Standard Library
**Goal:** Built-in primitives for system access.
- [ ] **`fs` Integration:** Read/Write files via sibling configs or DSL keywords.
- [ ] **Type Generation:** Derive TypeScript interfaces directly from SQL schema.

## 🚩 Milestone 9: Universal Runtime (Browser Parity)
**Goal:** Build native apps in the browser.
- [ ] **Browser Shims:** Auto-swap `native sql` for WASM-SQLite when running in a standard browser.
- [ ] **Viand Dev Tools:** A dashboard to inspect the "Manifest" and "Native Bridge" state.

## 🚩 Milestone 10: The Meta-Framework (@viand/framework)
- [ ] **Single Dependency:** Wrap Vite, Svelte, and Tauri into one toolkit.
- [ ] **CLI Scaffolding:** `viand create` for full-stack native apps.

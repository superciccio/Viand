# 🗺️ Viand Language Roadmap

This document tracks the strategic development milestones for the Viand language, moving from a prototype to a fully functional language on top of Svelte 5.

## 🚩 Milestone 0: Architecture Refactor (The "Object-way")
**Goal:** Move from brittle string-slicing to a structured Intermediate Representation (IR).
- [x] **Component Manifest:** Define a structured JS object representing the component.
- [x] **Recursive Renderer:** Implement a clean, reliable renderer for Svelte 5.
- [x] **Svelte 5 Runes:** Target `$state`, `$derived`, and `$props`.

## 🚩 Milestone 1: Control Flow (The "Brains")
**Goal:** Enable dynamic rendering of lists and conditional logic.
- [x] **`each` Loops:** Iterate over arrays (compiles to `{#each}`).
- [x] **`if/else` Blocks:** Conditional rendering (compiles to `{#if}` / `{:else}`).

## 🚩 Milestone 1.5: Advanced Control Flow
- [x] **`match` Statement:** A cleaner alternative to `if/else` chains.

## 🚩 Milestone 2: Two-Way Binding & Events
**Goal:** Simplify user input handling and state updates.
- [x] **Generic Two-Way Binding:** Support for any `bind:` attribute.
- [x] **Event Modifiers:** Support for `.` modifiers in event listeners.
- [x] **Conditional Classes:** Support for `class:name: $bool`.

## 🚩 Milestone 3: Reactivity (Computed State)
**Goal:** Leverage Svelte's reactive system for derived state.
- [x] **Computed Variables:** syntax to define variables that update automatically using `sync` (Svelte 5 `$derived`).

## 🚩 Milestone 4: Styling
**Goal:** Support component-scoped CSS within Viand files.
- [x] **`style:` Block:** A new root-level block for defining CSS.
- [x] **Scoped Compilation:** Compiles to a `<style>` tag.

## 🚩 Milestone 5: Developer Experience (CLI & Integration)
**Goal:** Improve the feedback loop for developers.
- [x] **Watch Mode:** A CLI command (`viand dev`) to recompile on file save.
- [x] **Vite Plugin:** Native `.viand` support in Vite (no more `.svelte` files on disk).
- [ ] **TypeScript Refactor:** Port the compiler to TypeScript for long-term stability.
- [ ] **Better Error Reporting:** More precise line numbers and error messages.
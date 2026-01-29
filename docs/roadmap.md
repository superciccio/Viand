# 🗺️ Viand Language Roadmap

This document tracks the strategic development milestones for the Viand language, moving from a prototype to a fully functional language on top of Svelte.

## 🚩 Milestone 1: Control Flow (The "Brains")
**Goal:** Enable dynamic rendering of lists and conditional logic.
- [x] **`each` Loops:** Iterate over arrays (compiles to `{#each}`).
- [x] **`if/else` Blocks:** Conditional rendering (compiles to `{#if}` / `{:else}`).

**Completed Syntax:**
```python
view:
    if $count > 5:
        p: "High count!"
    else:
        p: "Keep going..."

    each $todo in $todos:
        div .item: $todo.text
```

## 🚩 Milestone 1.5: Advanced Control Flow
- [x] **`match` Statement:** A cleaner alternative to `if/else` chains (compiles to `{#if} ... {:else if}`).
    ```python
    match $status:
        case "loading":
            Spinner:
        case "error":
            ErrorMsg:
    ```

## 🚩 Milestone 2: Two-Way Binding & Events
**Goal:** Simplify user input handling and state updates.
- [x] **Generic Two-Way Binding:** Support for any `bind:` attribute.
- [x] **Event Modifiers:** Support for `.` modifiers in event listeners.
- [x] **Syntax Cleanup:** Optional colon for self-closing tags.

**Completed Syntax:**
```python
# Binding
input(bind:value: $text, placeholder: "Type here")

# Events (Explicit)
form -> submit.preventDefault(handleSubmit):

# Events (Shorthand for Click)
button -> increment: "Add 1"
```

## 🚩 Milestone 3: Reactivity (Computed State)
**Goal:** Leverage Svelte's reactive system for derived state.
- [x] **Computed Variables:** syntax to define variables that update automatically using `sync`.

**Completed Syntax:**
```python
$count: number = 0
sync $double = $count * 2  # Compiles to $: double = count * 2;
```

## 🚩 Milestone 4: Styling
**Goal:** Support component-scoped CSS within Viand files.
- [x] **`style:` Block:** A new root-level block for defining CSS.
- [x] **Scoped Compilation:** Compiles to a `<style>` tag in the Svelte output.

**Completed Syntax:**
```python
style:
    .btn:
        background-color: blue
        color: white
        
        &:hover:
            background-color: darkblue
```

## 🚩 Milestone 5: Developer Experience (CLI)
**Goal:** Improve the feedback loop for developers.
- [x] **Watch Mode:** A CLI command (`viand dev`) to recompile on file save.
- [ ] **Better Error Reporting:** More precise line numbers and error messages during parsing.
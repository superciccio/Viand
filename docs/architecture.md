# Viand Architecture Specification (v1.0)

## 1. Core Philosophy

Viand is a high-level, indentation-based language designed to eliminate frontend boilerplate. It compiles into a standalone Signal-based foundation (@preact/signals-core), leveraging fine-grained reactivity while providing a cleaner, platform-aware syntax.

- **Logic**: Indentation-based (Python-style), no semi-colons, no curly braces.
- **Reactivity**: Implicit. Any variable prefixed with `$` is reactive, powered by Signals.
- **Environment**: Native-first. Built-in support for Tauri (Desktop) and Web via the `@platform` global.

## 2. Syntax Grammar (The "Unpacking" Rules)

### A. Reactive State

| Viand Syntax | Compiled JavaScript (Target) |
|--------------|----------------------------|
| `$count = 0` | `const count = signal(0);` (Fine-grained reactivity) |
| `$todos = []` | `const todos = signal([]);` |

### B. View Layer (The Tree)

The `view:` block uses colons and indentation to define hierarchy, which the compiler transforms into a `ViandWidget` instruction tree (Hyperscript).

- **Classes**: Defined with `.name` (e.g., `div .card .shadow:`)
- **Events**: Defined with `->` (e.g., `button "Click" -> increment()`)

### C. Logic Blocks

- **Loops**: `each item in $list:` → `renderList(list, item => ...)`
- **Conditionals**: `if $count > 10:` → `renderIf(count.value > 10, ...)` (or matching `match` logic)

## 3. The "Morphic" Engine (@platform)

The compiler evaluates the `@platform` global at build-time. This allows for code stripping (removing unused platform code to keep bundles small).
```viand
// Example Logic
if @platform.is_mobile:
    // This code only exists in the Mobile build
    UI::TouchMenu()
else:
    // This code only exists in the Desktop/Web build
    UI::Sidebar()
```

## 4. Namespace & Component Resolution

Viand uses a Directory-to-Namespace mapping.

- `UI::Button` maps to `src/UI/Button.viand`.
- The compiler automatically generates the import statements, preventing manual import blocks at the top of files.

## 5. Storage Abstraction (Drivers)

Viand provides a unified `sql` and `api` sibling pattern. The developer defines the resource, and the compiler injects the bridge.

| Context | Driver Injected | Persistent Tech |
|---------|-----------------|-----------------|
| Build `--web` | `web-signals-bridge` | Browser Local / Mock |
| Build `--desktop` | `tauri-signals-bridge` | Local SQLite / JSON |

## 6. The Compilation Pipeline

1. **Lexical Analysis**: The CLI reads `.viand` files and breaks them into tokens.
2. **Signal Mapping**: Tokens are mapped to reactive primitives (Signals, Computeds, Effects).
3. **Instruction Tree**: The compiler builds a `ViandWidget` tree (Hyperscript IR).
4. **Vite/Tauri Bridge**: The generated `.js` files are bundled into the final target.

## 7. Developer Experience (DX) Goals

- `viand dev`: Starts a watcher that hot-reloads the UI in milliseconds.
- `viand build`: Produces a production-ready bundle.
- **LSP**: Provide hover documentation showing component props and "Go to Definition" for Namespaces.
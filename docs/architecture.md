# Viand Architecture Specification (v1.0)

## 1. Core Philosophy

Viand is a high-level, indentation-based language designed to eliminate frontend boilerplate. It acts as a "Parasitic Language," transpiling into Svelte to leverage its optimized reactivity while providing a cleaner, platform-aware syntax.

- **Logic**: Indentation-based (Python-style), no semi-colons, no curly braces.
- **Reactivity**: Implicit. Any variable prefixed with `$` is reactive.
- **Environment**: Native-first. Built-in support for Tauri (Desktop) and Web via the `@platform` global.

## 2. Syntax Grammar (The "Unpacking" Rules)

### A. Reactive State

| Viand Syntax | Transpiled Svelte (Target) |
|--------------|----------------------------|
| `$count = 0` | `let count = 0;` (With Svelte 5 `$state` logic) |
| `$todos = []` | `let todos = [];` |

### B. View Layer (The Tree)

The `view:` block uses colons and indentation to define hierarchy, replacing HTML tags.

- **Classes**: Defined with `.name` (e.g., `div .card .shadow:`)
- **Events**: Defined with `->` (e.g., `button "Click" -> increment()`)

### C. Logic Blocks

- **Loops**: `for item in $list:` → `{#each list as item}`
- **Conditionals**: `if $count > 10:` → `{#if count > 10}`

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
- The compiler automatically generates the Svelte import statement, preventing manual import blocks at the top of files.

## 5. Storage Abstraction (Drivers)

Viand provides a unified `storage` keyword. The developer defines the "Bucket," and the compiler injects the driver.

| Context | Driver Injected | Persistent Tech |
|---------|-----------------|-----------------|
| Build `--web` | `web-indexeddb-driver` | Browser IndexedDB |
| Build `--desktop` | `tauri-sqlite-driver` | Local SQLite / JSON |

## 6. The Compilation Pipeline

1. **Lexical Analysis**: The CLI reads `.viand` files and breaks them into tokens.
2. **Svelte Mapping**: Tokens are mapped to Svelte-specific syntax (e.g., `$count` → `$state`).
3. **Template Generation**: Indented UI blocks are transformed into standard HTML tags.
4. **Vite/Tauri Bridge**: The generated `.svelte` files are passed to the Svelte compiler and bundled into the final target (Browser or Tauri App).

## 7. Developer Experience (DX) Goals

- `viand dev`: Starts a watcher that hot-reloads the UI in milliseconds.
- `viand build`: Produces a production-ready bundle.
- **LSP**: Provide hover documentation showing component props and "Go to Definition" for Namespaces.
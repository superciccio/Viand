# 🧠 The Viand LSP: A "Fantastic" DX Vision

A "fantastic" LSP for Viand isn't just about syntax highlighting; it's about making the **Sibling Pattern** and **Signals** feel like a single, cohesive superpower. To compete with Svelte or TypeScript, Viand needs an LSP that understands the *entire context* of a component.

## 1. 🔍 The "Superpowers" of a Fantastic LSP

### a. Sibling-Aware Autocomplete
The LSP shouldn't just know the `.viand` file. It should index the siblings:
- **SQL Intelligence:** When typing `sql.`, the LSP offers autocompletion for labels defined in the `.sql` sibling. 
- **API Bridge:** Auto-suggesting methods and paths from the `.api` sibling.
- **I18n Keys:** Autocomplete for `intl.t()` based on the `.lang` file.

### b. "Ghost" Peek & Hover
Since Viand is a "Ghost Code" language, the LSP should let you see the ghosts:
- **Hover a Signal:** Show the current reactive dependency graph (what triggers this signal and what does this signal trigger?).
- **Peek the SQL Bridge:** Right-click `sql.myQuery` to see the generated TypeScript wrapper and its return type in a popup.

### c. Reactive Graph Visualization
A special sidebar or "codelens" that visually draws the flow of data:
- `Sync` → `Signal` → `Computed` → `DOM`.
- Highlight "Dead Signals" (signals defined but never used).

### d. Smart Indentation & Refactoring
Because Viand is indentation-based, the LSP must be smarter than average:
- **Block Lifting:** Moving a UI block automatically updates the indentation for all children.
- **Component Extraction:** Select a chunk of `view:` and "Extract to new .viand component," automatically carrying over used signals and props.

### e. real-time "PITA" Validation
- **Missing Sibling Warn:** "Warning: `sql.getUser` is called but `Home.sql` is missing or the label is undefined."
- **Prop Validation:** "Error: `Button` expects a `label` prop, but none was provided."

## 🛠️ 2. What Do We Need to Achieve This?

To build this level of intelligence, we need more than a basic parser.

### 1. The Workspace Indexer (The Context Brain)
A background service that watches the entire project directory. It builds a global map of all `.sql`, `.api`, and `.memory` declarations so that `Component A` can autocomplete `Memory B`.

### 2. Semantic Graph (Beyond AST)
The current compiler produces an Abstract Syntax Tree (AST). A fantastic LSP needs a **Semantic Graph** where nodes are linked not just by hierarchy, but by **reference**.
- *Example:* Linking a variable used in a `view:` expression to its original declaration in `props:` or `state:`.

### 3. Integrated Type Inference
We need to bridge our Acorn-based JS parsing with a light version of the TypeScript type-checker. This allows the LSP to know that `sql.getUser` returns an `Object` and offer completions for its properties (e.g., `.name`, `.email`).

### 4. Wasm Build of the Compiler
To make the LSP run fast even in web-based IDEs (VS Code Web, GitHub Codespaces), the compiler and the LSP brain should be compiled to **WebAssembly**.

### 5. LSP Protocol Implementation (Node/Rust)
A robust server using `vscode-languageserver` (Node.js) or `tower-lsp` (Rust) that communicates over JSON-RPC. Given our current stack, a Node.js server sharing logic with our existing compiler is the fastest path to "Fantastic."

## 🏁 Final Thought
The LSP is the difference between a language that is "cool to look at" and a language that is "professional to use." By making the LSP **Sibling-Aware**, we prove that the Viand project structure isn't just a folder convention—it's a high-performance developer engine.

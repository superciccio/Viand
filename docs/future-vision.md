# 🚀 Viand: Beyond the Horizon (The Giant-Killer Plan)

This document outlines the strategic roadmap and technical requirements to position Viand as a serious competitor to established players like **Svelte**, **Next.js**, and **Hugo**.

## 1. ⚡ The "Speed of Thought" DX (vs Svelte/Vite)
To win against Svelte and Vite, Viand must feel *even lighter* and *more transparent*.

- **Ghost Mode Refinement:** The compiler should be completely invisible. A developer shouldn't even know JS is being generated.
- **Incremental Source Mapping:** Perfect debugging where a browser error points exactly to the `.viand` line, not the transpiled Signal logic.
- **Instant HMR (Hot Module Replacement):** Using our `ViandWidget` tree to patch only the modified component state without a full page reload or signal reset.

## 2. 🏛️ The "Full-Stack Sibling" Pattern (vs Next.js)
Next.js won because it unified the stack. Viand wins by **eliminating the friction of boilerplate.**

- **Middleware Sibling:** `Home.middleware` for handling authentication and redirects before the component even renders.
- **Isomorphic Nitro Engine:** Replace custom bake scripts with **Nitro** for a standardized server layer that runs on Vercel, Netlify, and Cloudflare.
- **Partial Hydration (Islands):** The ability to pre-render 90% of a page as static HTML and only "wake up" the interactive widgets (e.g., a cart button or search bar), outperforming Next.js's heavy bundle sizes.

## 3. ✍️ The "Content King" (vs Hugo)
Static Site Generators (SSGs) like Hugo are fast but rigid. Viand should be **Fast + Reactive.**

- **Markdown Sibling:** Support for `Post.md` that automatically injects its content and frontmatter into a `Post.viand` template.
- **Dynamic SSG Routing:** The `bake` command should support glob patterns for content-driven site generation (e.g., `bake posts/*.md`).
- **Asset Pipeline:** Built-in image optimization (WebP/AVIF generation) and CSS minification during the `bake` process.

## 4. 🔗 The "Native Monster" (Tauri Integration)
The end-goal is to make the same `.viand` file work on Web, Windows, macOS, and Linux.

- **`system:` Block:** A new sidecar/block type for interacting with Tauri's Rust-side commands natively.
- **System Signals:** Reactive signals that bind to system events (e.g., `$window.isFocused`, `$battery.level`).
- **Shared Memory:** Synchronized state between the browser-based UI and the native Rust backend.

## 5. 🏗️ Technical Hardening (The Foundation)
To handle "complex" things, the foundation must be bulletproof.

- **Reconciliation 2.0:** Moving from naive list rendering to a production-grade LIS (Longest Increasing Subsequence) algorithm.
- **Strict Validation:** A "linter" built into the compiler that catches type mismatches or missing Sibling resources at compile-time.
- **Standard Library (The Pantry):** Official, highly-optimized modules for:
    - `use auth` (OIDC/Supabase/Firebase)
    - `use storage` (Local/Cloud)
    - `use i18n` (Multi-language infrastructure)
    - `use ui` (A library of headless, accessible primitives)

## 🏁 Conclusion
Viand's edge isn't just "being fast"—it's **removing the cognitive load of modern web development.** By making everything a "Sibling" resource and leveraging Signals for performance, we can create a framework that scales from a simple blog to a massive native application without ever losing the simplicity of the Foundry.

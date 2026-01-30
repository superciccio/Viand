# ⚒️ Viand Nitro: Things to Iron Out

This document tracks technical issues, deprecations, and "rough edges" discovered during the Nitro integration prototype.

## ⚠️ Deprecations

### 1. Node.js `spawn` with `shell: true`
- **Warning:** `[DEP0190] DeprecationWarning: Passing args to a child process with shell option true can lead to security vulnerabilities...`
- **Context:** Occurs in `nitro-bridge.js` when starting `nitropack dev` via `npx`.
- **Resolution:** In the production CLI, locate the `nitropack` binary within `node_modules` and spawn it directly with specific arguments, avoiding the shell.

### 2. H3 Implicit Event Handler Conversion
- **Warning:** `[h3] Implicit event handler conversion is deprecated. Use eventHandler() or fromNodeMiddleware() to define event handlers.`
- **Context:** Occurs when Nitro loads the generated `.api.ts` handlers.
- **Resolution:** Update the Viand compiler's JS emitter to ensure all Sibling handlers are wrapped in the formal `eventHandler()` wrapper from `h3`.

## 🛠️ Pending Enhancements

- [ ] **Dynamic DSL to JS:** Automatically transpile `.api` and `.sql` DSL into the `h3` compatible JS handlers shown in the prototype.
- [ ] **Ghost Mode Integration:** Inject the Nitro `devHandler` for `.viand` files so SSR works without a manual `bake` step.
- [ ] **Port Conflicts:** Handle port conflicts gracefully (currently it just bumps to 3001 if 3000 is occupied).

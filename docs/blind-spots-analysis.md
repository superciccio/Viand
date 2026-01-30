# 👓 The "Blind Spots" Analysis (What we aren't thinking about yet)

We have a fantastic technical vision, but to be "Big Player" ready, we need to address these subtle but critical gaps.

## 1. 🛡️ The "Sibling" Security Breach
Our `.sql` and `.api` siblings are beautiful, but they are dangerous. 
- **The Problem:** If `Home.sql` contains a query `SELECT * FROM users`, how do we prevent a user from triggering that query if they aren't authorized?
- **The Solution:** A `Home.policy` sibling!
  ```viand
  # Home.policy
  sql.getUser:
    must be authenticated
    must own record
  ```
  We need a declarative way to secure siblings that the Nitro server can enforce.

## 2. 🤝 The "Hydration Handshake"
When Nitro renders `Home.viand` on the server, it initializes signals ($state). 
- **The Problem:** When the browser takes over, it re-initializes those signals to their default values, causing a "flicker" (state reset).
- **The Solution:** State Transfer. Nitro must serialize the "Signal Snapshot" into a `<script id="__VIAND_DATA__">` tag so the browser-side runtime can "resume" the state instead of resetting it.

## 3. 🧪 Logic Sibling Testing
We have `test:` blocks for UI, but how do we test the backend siblings in isolation?
- **The Goal:** A way to run `viand test Home.sql` which spins up a mock container, runs the queries, and verifies the schema without needing a full browser or UI.

## 4. 🚀 The "SWR" Pattern (Stale-While-Rehydrate)
In a Signals world, data is alive.
- **The Missing Piece:** A native way to handle background updates.
  ```viand
  state $users = api.getUsers() with swr # Refreshes in background automatically
  ```
  We need to think about how signals handle the "Loading -> Success -> Background Refresh" cycle without making the UI janky.

## 5. 🏗️ Component Ecosystem (The "Pantry")
Svelte has Svelte-Lib, Next has Shadcn/ui.
- **The Gap:** Viand needs a "Standard Library" of primitives. Not just code, but pre-built siblings for common tasks:
  - **Auth Sibling:** A universal auth bridge that works for any provider.
  - **Form Sibling:** Handling validation and submission state signals automatically.

## 🎨 6. The "Viand Playground"
To win the hearts of developers, they need to try it *without* installing anything.
- **Requirement:** A browser-based IDE (similar to the Svelte REPL) that runs the Viand compiler in Wasm and shows a live preview. This is the #1 tool for community growth.

## 🏁 Summary
We have the **Engine** (Signals/Compiler) and the **Chassis** (Nitro/Tauri). Now we need the **Safety Systems** (Security/Validation) and the **Interior Comfort** (Playground/SWR/Pantry) to make it a car people actually want to drive.

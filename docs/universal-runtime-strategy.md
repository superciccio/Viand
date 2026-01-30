# 🌐 The Universal Runtime: Beating "Adapter Hell"

The user is right: maintaining a fleet of adapters (Vercel, Netlify, AWS, Cloudflare) is a full-time job that distracts from the core language. Viand must avoid this by adopting a **"Platform-Agnostic Core"** strategy.

## 1. The Trap: Manual Adapters
Frameworks like early SvelteKit had to write specific logic for every platform's unique way of handling requests. This is fragile and impossible for a small team to test.

## 2. The Solution: Nitro as the "Universal Glue"
By using **Nitro**, we aren't writing adapters. We are writing a **Nitro App**. Nitro already has a community of hundreds of contributors maintaining the "Presets" for every cloud provider.

- **Viand's Job:** Build a standard Nitro server (using `h3`).
- **Nitro's Job:** Convert that server into a Vercel-specific function or a Cloudflare Worker.
- **Testing:** We only need to test that Viand works on a **Standard Web Runtime**. If it works on Node.js (via Nitro), it is mathematically likely to work on the others because the presets handle the transformation logic.

## 3. The "Standard Web API" Rule
To ensure portability without testing every platform, Viand's internal server logic must strictly use **Standard Web APIs**:
- `Request` / `Response`
- `URL` / `URLSearchParams`
- `ReadableStream`
- `Uint8Array`

By avoiding Node.js-specific modules (like `fs` or `path`) inside the component logic, the code becomes "Edge-Ready" by default.

## 4. "Bake Once, Run Anywhere"
Instead of `viand build --adapter-vercel`, we should aim for:
1. **The Default Build:** `viand build` produces a standard Node.js server.
2. **The Preset Flag:** `viand build --preset vercel`. This simply passes the flag to Nitro. 

Nitro becomes our **Buffer**. If Vercel changes their API, Nitro updates their preset, and Viand gets the fix for free without us writing a single line of integration code.

## 5. How to Validate Without Testing Everything
We don't need to test every platform. We only need **three test environments**:
1. **Local Dev (Vite):** Fast iteration.
2. **Standard Node.js (Nitro):** The baseline server behavior.
3. **Wasm/Edge Runtime (Miniflare/Workerd):** To ensure we aren't using forbidden Node.js APIs.

If it passes these three, it will run on 99% of cloud providers.

## 🏁 Conclusion
We don't build adapters. We build a **Universal Viand Engine** that talks the **Web Standard language**. Nitro is just the delivery mechanism that packages that standards-compliant engine for the rest of the world.

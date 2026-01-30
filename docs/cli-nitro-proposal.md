# 🏎️ Proposal: The Viand Isomorphic Engine (Nitro Integration)

To compete with **SvelteKit** and **Nuxt**, Viand's CLI needs to evolve from a "static baker" into an "Isomorphic Server Engine." Integration with **Nitro** (unjs/nitro) is the most strategic path forward.

## 1. 🎯 Why Nitro?
Nitro is the engine that powers Nuxt. It provides a standardized way to build servers that run anywhere (Node.js, Vercel, Netlify, Cloudflare Workers, Bun).

- **Zero-Config Deployment:** Write once, deploy to Edge or Serverless without changing code.
- **No Manual Adapters:** We leverage Nitro's community-vetted presets. Viand doesn't need to write or test code for Vercel/Netlify/Cloudflare—we just target the Nitro standard.
- **Unified Sibling Execution:** Nitro can be the host for our `.sql` and `.api` sibling logic on the server.
- **Server-Side Routing:** Standardized handling of dynamic routes and middleware.
- **Fast HMR:** Combined with Vite, it provides a seamless developer experience.

## 2. 🏛️ The "Viand + Nitro" Architecture

### a. The Sibling Resolver
Nitro's server layer will automatically detect and "warm up" Viand siblings:
- `Home.viand` → Frontend UI.
- `Home.sql` → Nitro Server Route (Database Layer).
- `Home.api` → Nitro Server Route (Proxy/Bridge Layer).

### b. Unified Build Pipeline
Instead of our custom `bake --ssr` script, `viand dev` and `viand build` would trigger the Nitro build process:
```bash
viand build --preset vercel
```
This would bundle the frontend (Vite) and the backend (Nitro) into a single, optimized deployment package.

## 3. 🛠️ CLI Refactor Roadmap

### Short-Term (The Glue)
- Replace `ssr-helper.js` with a Nitro-based server entry.
- Map `.viand` routes to Nitro's `routes/` directory.

### Mid-Term (The Bridge)
- **Auto-API:** Automatically generate Nitro server API routes from `.api` siblings.
- **SQL Bridge:** Transparently execute `.sql` siblings through Nitro's `h3` event handler, connecting to the real DB in production and mocks in dev.

### Long-Term (The Summit)
- **Edge Assets:** Deploy optimized images and static assets to CDN edges via Nitro's storage layer.
- **Universal Cache:** Signal-aware caching—only re-bake/re-render components when their underlying data signals change.

## 🏁 Conclusion
By adopting Nitro, Viand moves from being a "tool" that generates files into a **Professional Application Platform**. We stop reinventing the wheel on server adapters and focus entirely on the **Sibling DX** and **Signal performance** that makes Viand unique.

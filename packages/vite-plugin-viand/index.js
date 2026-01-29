import { compile } from '../compiler/src/index.ts';

export default function viand() {
  return {
    name: 'vite-plugin-viand',
    enforce: 'pre', // Run before the Svelte plugin
    transform(code, id) {
      if (!id.endsWith('.viand')) return null;

      try {
        const svelteCode = compile(code);
        if (id.includes('App.viand')) {
            console.log("--- VITE PLUGIN OUTPUT FOR App.viand ---");
            console.log(svelteCode);
        }
        return {
          code: svelteCode,
          map: null
        };
      } catch (e) {
        console.error(`[Viand] Error in ${id}:`);
        console.error(e.message);
        return null;
      }
    }
  };
}

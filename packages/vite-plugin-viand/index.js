import { compile } from '../compiler/src/index.ts';

export default function viand() {
  return {
    name: 'vite-plugin-viand',
    enforce: 'pre',
    
    transform(src, id) {
      if (!id.endsWith('.viand')) return null;

      try {
        const svelte = compile(src);
        return {
          code: svelte,
          map: null
        };
      } catch (e) {
        console.error(`[Viand] Compilation Error in ${id}:`);
        console.error(e.stack || e.message);
        return null;
      }
    }
  };
}

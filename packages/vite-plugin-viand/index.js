import { compile } from '../compiler/src/index.ts';

export default function viand() {
  return {
    name: 'vite-plugin-viand',
    enforce: 'pre',
    
    transform(src, id) {
      if (!id.endsWith('.viand')) return null;

      try {
        const sqlPath = id.replace('.viand', '.sql');
        let sql = "";
        if (fs.existsSync(sqlPath)) {
            sql = fs.readFileSync(sqlPath, 'utf-8');
        }

        const svelte = compile(src, sql);
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

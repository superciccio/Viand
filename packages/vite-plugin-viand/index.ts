import fs from 'fs';
import { processViand } from '../compiler/src/index.ts';

/**
 * 👻 Viand Ghost-Mode Plugin
 * Transforms .viand files into Reactive Signals in RAM.
 */
export default function viand() {
  return {
    name: 'vite-plugin-viand',
    enforce: 'pre',
    
    transform(src, id) {
      if (!id.endsWith('.viand')) return null;

      try {
        // 1. Resolve Siblings (In RAM)
        const sqlPath = id.replace('.viand', '.sql');
        const apiPath = id.replace('.viand', '.api');
        const langPath = id.replace('.viand', '.lang');

        const sql = fs.existsSync(sqlPath) ? fs.readFileSync(sqlPath, 'utf-8') : "";
        const api = fs.existsSync(apiPath) ? fs.readFileSync(apiPath, 'utf-8') : "";
        const lang = fs.existsSync(langPath) ? fs.readFileSync(langPath, 'utf-8') : "";

        // 2. Atomic Transformation
        const { signals, reports } = processViand(src, sql, api, lang, id);

        // 3. Health Gauge (Reporting)
        if (reports?.length) {
            reports.forEach(r => console.warn(`[Viand Gauge] ${id}: ${r}`));
        }

        return {
          code: signals,
          map: null
        };
      } catch (e) {
        console.error(`[Viand Crash] Fatal error in ${id}:`);
        console.error(e.stack || e.message);
        return null;
      }
    }
  };
}
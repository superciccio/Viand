import { defineNitroConfig } from 'nitropack/config';
import path from 'path';
import fs from 'fs';

export default defineNitroConfig({
    srcDir: "src",
    scanDirs: ["src"],
    typescript: {
        generateTsConfig: true
    },
    devHandlers: [
    ],
    handlers: [
        ...(() => {
            const srcDir = path.resolve(process.cwd(), "src");
            if (!fs.existsSync(srcDir)) return [];
            const files = fs.readdirSync(srcDir);
            return files.filter(f => f.endsWith('.api.ts') || f.endsWith('.sql.ts')).map(f => {
                const isSql = f.endsWith('.sql.ts');
                const name = isSql ? f.replace('.sql.ts', '').toLowerCase() : f.replace('.api.ts', '').toLowerCase();
                return {
                    route: `/api/${name}`,
                    handler: `src/${f}`
                };
            });
        })()
    ],
    compatibilityDate: '2026-01-30'
});

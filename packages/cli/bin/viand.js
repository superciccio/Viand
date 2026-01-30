#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { processViand } from '../../compiler/src/index.ts';
import { renderToHtml } from './ssr-helper.js';
import { runNitroDev } from './nitro-bridge.js';
import { buildSync } from 'esbuild';
import { register } from 'tsx/esm/api';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const command = args[0];
const nonFlagArgs = args.filter(arg => !arg.startsWith('--'));
const targetDir = nonFlagArgs[1] || '.';
const projectRoot = path.resolve(process.cwd(), targetDir);
const srcDir = path.join(projectRoot, 'src');

if (!command) {
    console.log("🌿 Viand CLI v0.1.0");
    console.log("Usage: viand <command> [dir]");
    process.exit(1);
}

function preflight() {
    console.log(`🏗️  Performing pre-flight scan in ${srcDir}...`);

    // Inject Stdlib
    [['router.ts', 'viand-router.ts'],
    ['notify.ts', 'viand-notify.ts'],
    ['intl.ts', 'viand-intl.ts']].forEach(([src, dest]) => {
        const srcPath = path.resolve(__dirname, '../../stdlib/src', src);
        const destPath = path.join(srcDir, dest);
        if (fs.existsSync(srcPath)) fs.copyFileSync(srcPath, destPath);
    });

    if (!fs.existsSync(srcDir)) return;
    const files = fs.readdirSync(srcDir);
    const processedSiblings = new Set();

    files.forEach(file => {
        if (file.endsWith('.viand')) {
            const filePath = path.join(srcDir, file);
            const sqlPath = filePath.replace('.viand', '.sql');
            const apiPath = filePath.replace('.viand', '.api');
            const langPath = filePath.replace('.viand', '.lang');

            const code = fs.readFileSync(filePath, 'utf-8');
            const sql = fs.existsSync(sqlPath) ? fs.readFileSync(sqlPath, 'utf-8') : "";
            const api = fs.existsSync(apiPath) ? fs.readFileSync(apiPath, 'utf-8') : "";
            const lang = fs.existsSync(langPath) ? fs.readFileSync(langPath, 'utf-8') : "";

            if (fs.existsSync(apiPath)) processedSiblings.add(apiPath);
            if (fs.existsSync(sqlPath)) processedSiblings.add(sqlPath);

            try {
                const { nitro, sql: sqlContent, reports } = processViand(code, sql, api, lang, filePath);
                if (reports?.length) reports.forEach(r => console.warn(`⚠️ [${file}] ${r}`));

                // Transpile Siblings to Nitro Handlers
                if (api) fs.writeFileSync(`${apiPath}.ts`, nitro);
                if (sql) fs.writeFileSync(`${sqlPath}.ts`, sqlContent);
            } catch (e) {
                console.error(`❌ Pre-flight failed for ${file}: ${e.message}`);
            }
        }
    });

    // Handle standalone Siblings
    files.forEach(file => {
        const filePath = path.join(srcDir, file);
        if (file.endsWith('.api') && !processedSiblings.has(filePath)) {
            const api = fs.readFileSync(filePath, 'utf-8');
            try {
                const { nitro } = processViand("", "", api, "", filePath);
                fs.writeFileSync(`${filePath}.ts`, nitro);
            } catch (e) {
                console.error(`❌ Pre-flight failed for standalone API ${file}: ${e.message}`);
            }
        }
        if (file.endsWith('.sql') && !processedSiblings.has(filePath)) {
            const sql = fs.readFileSync(filePath, 'utf-8');
            try {
                const { sql: sqlContent } = processViand("", sql, "", "", filePath);
                fs.writeFileSync(`${filePath}.ts`, sqlContent);
            } catch (e) {
                console.error(`❌ Pre-flight failed for standalone SQL ${file}: ${e.message}`);
            }
        }
    });
}

if (command === 'dev') {
    preflight();
    spawn('npm', ['run', 'dev'], { cwd: projectRoot, stdio: 'inherit', shell: true });
} else if (command === 'check') {
    preflight();
} else if (command === 'bake') {
    preflight();
    const enableSSR = args.includes('--ssr');
    console.log(enableSSR ? '♨️  SSR Mode Enabled' : '🎨 Client-Side Rendering Mode');

    const distEntries = path.join(projectRoot, '_viand_bake');
    if (fs.existsSync(distEntries)) fs.rmSync(distEntries, { recursive: true, force: true });
    fs.mkdirSync(distEntries, { recursive: true });

    let ssrContentMap = {};
    let ssrHeadMap = {};
    let collectedStyles = '';

    if (enableSSR) {
        console.log("♨️  Pre-heating the Oven (Transpiling components)...");
        const allFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.viand') || (f.endsWith('.ts') && !f.includes('.ssr.tmp')));

        const tmpDir = path.join(projectRoot, '.viand_tmp_ssr');
        if (fs.existsSync(tmpDir)) fs.rmSync(tmpDir, { recursive: true, force: true });
        fs.mkdirSync(tmpDir, { recursive: true });

        for (const file of allFiles) {
            const filePath = path.join(srcDir, file);
            let code = fs.readFileSync(filePath, 'utf-8');
            if (file.endsWith('.viand')) {
                const { signals } = processViand(code);
                code = signals;
            }

            // Map @viand/runtime to absolute path (use built .js for Node.js compatibility)
            const runtimePath = path.resolve(__dirname, '../../runtime/dist/index.js');
            code = code.replace(/from "@viand\/runtime"/g, `from "${runtimePath}"`);
            // Also handle .viand imports by converting them to .js
            code = code.replace(/from "(\.\.?\/[^"]+)\.viand"/g, 'from "$1.js"');
            // Also handle .ts imports by converting them to .js
            code = code.replace(/from "(\.\.?\/[^"]+)\.ts"/g, 'from "$1.js"');

            const outPath = path.join(tmpDir, file.replace('.viand', '.js').replace('.ts', '.js'));

            // Transpile TypeScript to JavaScript without bundling
            buildSync({
                stdin: {
                    contents: code,
                    resolveDir: tmpDir,
                    sourcefile: file,
                    loader: 'ts'
                },
                bundle: false,  // Don't bundle - just transpile
                format: 'esm',
                outfile: outPath,
                platform: 'node',
                target: 'node18'  // Target modern Node.js
            });
        }

        console.log("♨️  Baking static pages (SSR)...");
        const viandFilesSSR = fs.readdirSync(srcDir).filter(f => f.endsWith('.viand'));

        // Initialize style collection for SSR
        global.__viand_styles = [];

        for (const file of viandFilesSSR) {
            if (!file.startsWith('Shell')) {
                const name = file.replace('.viand', '');

                try {
                    const jsPath = path.join(tmpDir, file.replace('.viand', '.js'));
                    const module = await import('file://' + jsPath);
                    ssrContentMap[name] = module[name]();
                    ssrHeadMap[name] = module.__head || {};
                } catch (e) {
                    console.error(`❌ Failed to SSR ${name}:`, e);
                    ssrContentMap[name] = "";
                    ssrHeadMap[name] = {};
                }
            }
        }

        // Collect all styles
        collectedStyles = global.__viand_styles.join('\n');
        delete global.__viand_styles;

        fs.rmSync(tmpDir, { recursive: true, force: true });
    }

    console.log("📄 Generating HTML pages...");
    const viandFiles = fs.readdirSync(srcDir).filter(f => f.endsWith('.viand'));

    for (const file of viandFiles) {
        if (!file.startsWith('Shell')) {
            const name = file.replace('.viand', '');
            const entryDir = name === 'Home' ? distEntries : path.join(distEntries, name.toLowerCase());
            if (!fs.existsSync(entryDir)) fs.mkdirSync(entryDir, { recursive: true });

            const ssrContent = enableSSR ? (ssrContentMap[name] || "") : "";
            const headData = ssrHeadMap[name] || {};

            let headTags = "";
            if (headData.title) headTags += `<title>${headData.title}</title>`;
            if (headData.meta) {
                Object.entries(headData.meta).forEach(([k, v]) => {
                    headTags += `<meta name="${k}" content="${v}">`;
                });
            }
            if (headData.og) {
                Object.entries(headData.og).forEach(([k, v]) => {
                    headTags += `<meta property="og:${k}" content="${v}">`;
                });
            }
            if (headData.twitter) {
                Object.entries(headData.twitter).forEach(([k, v]) => {
                    headTags += `<meta name="twitter:${k}" content="${v}">`;
                });
            }
            if (headData.link) {
                headData.link.forEach(l => {
                    const attrs = Object.entries(l).map(([k, v]) => `${k}="${v}"`).join(' ');
                    headTags += `<link ${attrs}>`;
                });
            }

            const staticHtml = `<div id="app">${ssrContent}</div>`;
            const styleTag = enableSSR && collectedStyles ? `<style>${collectedStyles}</style>` : '';
            const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">${headTags}${!headData.title ? `<title>Viand Baked: ${name}</title>` : ''}${styleTag}</head><body>${staticHtml}<script type="module">import { mount } from "@viand/runtime"; import { ${name} } from "../src/${file}"; mount(document.getElementById("app"), () => ${name}());</script></body></html>`;
            fs.writeFileSync(path.join(entryDir, 'index.html'), html);
        }
    }

    const config = `import { defineConfig } from 'vite'; import userConfig from './vite.config'; import { resolve } from 'path'; export default defineConfig({ ...userConfig, root: '_viand_bake', build: { outDir: '../dist', emptyOutDir: true } });`;
    fs.writeFileSync(path.join(projectRoot, 'vite.bake.config.ts'), config);
    spawn('npx', ['vite', 'build', '--config', 'vite.bake.config.ts'], { cwd: projectRoot, stdio: 'inherit', shell: true });
} else if (command === 'serve') {
    spawn('npx', ['vite', 'preview'], { cwd: projectRoot, stdio: 'inherit', shell: true });
} else if (command === 'verify') {
    preflight();
    spawn('npx', ['vitest', 'run'], { cwd: projectRoot, stdio: 'inherit', shell: true });
} else if (command === 'nitro-dev') {
    preflight();
    runNitroDev(projectRoot, srcDir);
} else if (command === 'add' && args[2] === 'tailwind') {
    const install = spawn('npm', ['install', '-D', 'tailwindcss', '@tailwindcss/postcss', 'postcss', 'autoprefixer'], { cwd: projectRoot, stdio: 'inherit', shell: true });
    install.on('close', () => {
        fs.writeFileSync(path.join(projectRoot, 'tailwind.config.js'), 'export default { content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx,viand}"], theme: { extend: {} }, plugins: [], }');
        fs.writeFileSync(path.join(projectRoot, 'postcss.config.js'), 'export default { plugins: { "@tailwindcss/postcss": {}, autoprefixer: {}, }, }');
        fs.writeFileSync(path.join(srcDir, 'app.css'), '@import "tailwindcss";\n@source "./src/**/*.viand";');
        console.log("✅ Tailwind configured.");
    });
}
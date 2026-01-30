#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { processViand } from '../../compiler/src/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const args = process.argv.slice(2);
const command = args[0];
const targetDir = args[1] || '.';
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
    [['router.svelte.ts', 'viand-router.svelte.ts'], 
     ['notify.ts', 'viand-notify.ts'], 
     ['intl.svelte.ts', 'viand-intl.svelte.ts']].forEach(([src, dest]) => {
        const srcPath = path.resolve(__dirname, '../../stdlib/src', src);
        const destPath = path.join(srcDir, dest);
        if (fs.existsSync(srcPath)) fs.copyFileSync(srcPath, destPath);
    });

    if (!fs.existsSync(srcDir)) return;
    const files = fs.readdirSync(srcDir);
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

            try {
                // ATOMIC PREFLIGHT: No more logic file generation!
                // Everything happens in-memory via the Vite plugin.
                const { reports } = processViand(code, sql, api, lang, filePath);
                if (reports?.length) reports.forEach(r => console.warn(`⚠️ [${file}] ${r}`));
            } catch (e) {
                console.error(`❌ Pre-flight failed for ${file}: ${e.message}`);
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
    const distEntries = path.join(projectRoot, '_viand_bake');
    if (fs.existsSync(distEntries)) fs.rmSync(distEntries, { recursive: true, force: true });
    fs.mkdirSync(distEntries, { recursive: true });
    
    const inputs = [];
    fs.readdirSync(srcDir).forEach(file => {
        if (file.endsWith('.viand') && !file.startsWith('Shell')) {
            const name = file.replace('.viand', '');
            const entryPath = path.join(distEntries, name === 'Home' ? 'index.html' : `${name.toLowerCase()}/index.html`);
            if (!fs.existsSync(path.dirname(entryPath))) fs.mkdirSync(path.dirname(entryPath), { recursive: true });
            
            const html = `<!DOCTYPE html><html><body><div id="app"></div><script type="module">import { mount } from "svelte"; import App from "../src/${file}"; mount(App, { target: document.getElementById("app") });</script></body></html>`;
            fs.writeFileSync(entryPath, html);
            inputs.push(name === 'Home' ? 'index.html' : `${name.toLowerCase()}/index.html`);
        }
    });

    const config = `import { defineConfig } from 'vite'; import userConfig from './vite.config'; import { resolve } from 'path'; export default defineConfig({ ...userConfig, root: '_viand_bake', build: { outDir: '../dist', emptyOutDir: true } });`;
    fs.writeFileSync(path.join(projectRoot, 'vite.bake.config.ts'), config);
    spawn('npx', ['vite', 'build', '--config', 'vite.bake.config.ts'], { cwd: projectRoot, stdio: 'inherit', shell: true });
} else if (command === 'serve') {
    spawn('npx', ['vite', 'preview'], { cwd: projectRoot, stdio: 'inherit', shell: true });
} else if (command === 'verify') {
    preflight();
    spawn('npx', ['vitest', 'run'], { cwd: projectRoot, stdio: 'inherit', shell: true });
} else if (command === 'add' && args[2] === 'tailwind') {
    const install = spawn('npm', ['install', '-D', 'tailwindcss', '@tailwindcss/postcss', 'postcss', 'autoprefixer'], { cwd: projectRoot, stdio: 'inherit', shell: true });
    install.on('close', () => {
        fs.writeFileSync(path.join(projectRoot, 'tailwind.config.js'), 'export default { content: ["./index.html", "./src/**/*.{svelte,js,ts,jsx,tsx,viand}"], theme: { extend: {} }, plugins: [], }');
        fs.writeFileSync(path.join(projectRoot, 'postcss.config.js'), 'export default { plugins: { "@tailwindcss/postcss": {}, autoprefixer: {}, }, }');
        fs.writeFileSync(path.join(srcDir, 'app.css'), '@import "tailwindcss";\n@source "./src/**/*.viand";');
        console.log("✅ Tailwind configured.");
    });
}

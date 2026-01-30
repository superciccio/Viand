#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { processViand } from '../../compiler/src/index.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("🌿 Viand CLI v0.1.0");
const args = process.argv.slice(2);
const command = args[0];
const targetDir = args[1] || '.';

const projectRoot = path.resolve(process.cwd(), targetDir);
const srcDir = path.join(projectRoot, 'src');

if (!fs.existsSync(srcDir)) {
    console.error(`❌ Error: 'src' directory not found in: ${projectRoot}`);
    process.exit(1);
}

// Helper: Scan and Process Viand Files (Pre-flight)
function preflight() {
    console.log(`🏗️  Performing pre-flight scan in ${srcDir}...`);
    
    // Inject Standard Library (Router)
    const routerSrc = path.resolve(__dirname, '../../stdlib/src/router.svelte.ts');
    const routerDest = path.join(srcDir, 'viand-router.svelte.ts'); // Note: Copied as .ts so Vite handles it? Or .svelte.ts
    // Wait, Vite + Svelte 5 needs .svelte.ts extension for runes?
    // My compiler generates imports to "./viand-router.svelte".
    // Vite resolves .svelte to the file?
    // Actually, if it's a TS file with runes, it should be .svelte.ts. 
    // And import should be from .svelte.ts or .svelte?
    // Svelte 5 docs say: .svelte.js/ts modules.
    
    // My compiler generates: import { router } from "./viand-router.svelte";
    // This implies I should name the file `viand-router.svelte`? 
    // No, that looks like a component.
    // I should probably fix the compiler to import from `.svelte.ts`.
    
    // BUT for now, let's copy it to `viand-router.svelte.ts`.
    // And if the import is wrong, I'll fix the compiler.
    
    // Let's assume compiler is wrong and fix it later if needed.
    // Or maybe compiler generates import from `./viand-router.svelte` assuming resolving extensions?
    
    // Let's copy it.
    if (fs.existsSync(routerSrc)) {
        fs.copyFileSync(routerSrc, routerDest);
    } else {
        console.warn("⚠️  Warning: Standard Library Router not found at " + routerSrc);
    }

    const files = fs.readdirSync(srcDir);
    files.forEach(file => {
        if (file.endsWith('.viand')) {
            const filePath = path.join(srcDir, file);
            const sqlPath = filePath.replace('.viand', '.sql');
            
            const code = fs.readFileSync(filePath, 'utf-8');
            let sql = "";
            if (fs.existsSync(sqlPath)) {
                sql = fs.readFileSync(sqlPath, 'utf-8');
                console.log(`🔍 Found SQL sibling: ${file.replace('.viand', '.sql')}`);
            }

            try {
                const { tests, logic } = processViand(code, sql);
                // Always write logic file (Memory or Component)
                if (logic) {
                    fs.writeFileSync(filePath.replace('.viand', '.viand.logic.svelte.ts'), logic);
                }
                // Write tests if they exist
                if (tests) {
                    fs.writeFileSync(filePath.replace('.viand', '.test.ts'), tests);
                }
            } catch (e) {
                console.error(`❌ Pre-flight failed for ${file}: ${e.message}`);
            }
        }
    });
}

if (command === 'dev') {
    preflight();
    console.log(`🚀 Starting Viand Dev Server in ${projectRoot}...`);
    
    // Check if package.json exists, if not, we might strictly rely on global vite?
    // For now assume standard setup
    const vite = spawn('npm', ['run', 'dev'], { 
        cwd: projectRoot, 
        stdio: 'inherit',
        shell: true 
    });
    vite.on('close', (code) => process.exit(code || 0));
} 
else if (command === 'bake') {
    console.log(`🥖 Baking project in ${projectRoot}...`);
    preflight();

    // 1. Generate HTML Entry Points (Directory Index Style)
    const distEntries = path.join(projectRoot, '_viand_bake');
    // Clean old bake
    if (fs.existsSync(distEntries)) fs.rmSync(distEntries, { recursive: true, force: true });
    fs.mkdirSync(distEntries, { recursive: true });

    const inputs = [];
    const files = fs.readdirSync(srcDir);

    files.forEach(file => {
        if (file.endsWith('.viand') && !file.startsWith('Shell')) {
            const name = file.replace('.viand', '');
            if (name[0] !== name[0].toUpperCase()) return;

            // ... (HTML Generation Logic) ...
            
            // Directory-based routing: Home -> index.html, About -> about/index.html
            let entryDir;
            if (name.toLowerCase() === 'home' || name.toLowerCase() === 'index') {
                entryDir = distEntries;
                inputs.push('index.html');
            } else {
                entryDir = path.join(distEntries, name.toLowerCase());
                if (!fs.existsSync(entryDir)) fs.mkdirSync(entryDir, { recursive: true });
                inputs.push(`${name.toLowerCase()}/index.html`);
            }

            const entryPath = path.join(entryDir, 'index.html');
            const relativeSrc = path.relative(path.dirname(entryPath), path.join(srcDir, file));
            const hasCss = fs.existsSync(path.join(srcDir, 'app.css'));
            const cssImport = hasCss ? `import './${path.relative(path.dirname(entryPath), path.join(srcDir, 'app.css'))}';` : '';
            
            const entryHtml = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module">
      ${cssImport}
      import { mount } from 'svelte';
      import App from './${relativeSrc}';
      mount(App, { target: document.getElementById('app') });
    </script>
  </body>
</html>`;
            
            fs.writeFileSync(entryPath, entryHtml);
            console.log(`📄 Generated entry: ${name} -> ${path.relative(projectRoot, entryPath)}`);
        }
    });

    // 2. Generate Temporary Bake Config
    const bakeConfigPath = path.join(projectRoot, 'vite.bake.config.ts');
    
    // We import the user's config and override the build options
    const bakeConfigContent = `
import { defineConfig } from 'vite';
import userConfig from './vite.config';
import { resolve } from 'path';

export default defineConfig({
  ...userConfig,
  root: '_viand_bake',
  build: {
    ...userConfig.build,
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        ${inputs.map(i => {
            // i is like 'index.html' or 'about/index.html'
            const key = i.replace('/index.html', '').replace('index.html', 'main') || 'main';
            return `'${key}': resolve(__dirname, '_viand_bake/${i}')`;
        }).join(',\n        ')}
      }
    }
  }
});`;
    
    fs.writeFileSync(bakeConfigPath, bakeConfigContent);
    console.log("📝 Generated vite.bake.config.ts");

    console.log("🔥 Firing up the oven (Vite Build)...");
    
    const build = spawn('npx', ['vite', 'build', '--config', 'vite.bake.config.ts'], {
        cwd: projectRoot,
        stdio: 'inherit',
        shell: true
    });
    
    build.on('close', (code) => {
        // Cleanup
        if (fs.existsSync(bakeConfigPath)) fs.unlinkSync(bakeConfigPath);

        if (code === 0) {
            console.log(`✅ Baked fresh! Served in ${path.join(projectRoot, 'dist')}`);
        } else {
            console.error("❌ Burnt! Build failed.");
        }
        process.exit(code || 0);
    });

} 
else if (command === 'serve') {
    console.log(`🍽️  Serving the feast in ${projectRoot}...`);
    
    const preview = spawn('npx', ['vite', 'preview'], { 
        cwd: projectRoot, 
        stdio: 'inherit',
        shell: true 
    });
    preview.on('close', (code) => process.exit(code || 0));
}
else if (command === 'verify') {
    console.log(`🕵️  Verifying project health in ${projectRoot}...`);
    preflight(); // Ensure logic files are generated

    // Find entry point
    const possibleEntries = ['App.viand', 'Home.viand', 'index.viand'];
    const entryFile = fs.readdirSync(srcDir).find(f => possibleEntries.includes(f));

    if (!entryFile) {
        console.error("❌ No obvious entry point found (App.viand, Home.viand). Cannot smoke test.");
        process.exit(1);
    }

    const testPath = path.join(projectRoot, 'viand-smoke.test.ts');
    const testContent = `
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import Entry from './src/${entryFile}';

describe('Smoke Test', () => {
  it('mounts ${entryFile} without crashing', () => {
    const { container } = render(Entry);
    expect(container.innerHTML).toBeTruthy();
    // Check for common error indicators if needed
    expect(container.innerHTML).not.toContain('Undefined');
  });
});`;

    fs.writeFileSync(testPath, testContent);

    console.log(`🧪 Running smoke test on ${entryFile}...`);
    
    // We need to run vitest on this specific file
    const test = spawn('npx', ['vitest', 'run', 'viand-smoke.test.ts'], {
        cwd: projectRoot,
        stdio: 'inherit',
        shell: true
    });

    test.on('close', (code) => {
        if (fs.existsSync(testPath)) fs.unlinkSync(testPath);
        
        if (code === 0) {
            console.log("✅ Project is ALIVE. Smoke test passed.");
        } else {
            console.error("❌ Project is DEAD. Smoke test failed.");
        }
        process.exit(code || 0);
    });
}
else if (command === 'add') {
    const plugin = args[2]; // Fixed: args[1] is targetDir, args[2] is plugin
    if (plugin === 'tailwind') {
        console.log(`🎨 Adding Tailwind CSS to ${projectRoot}...`);
        
        // 1. Install dependencies
        const install = spawn('npm', ['install', '-D', 'tailwindcss', '@tailwindcss/postcss', 'postcss', 'autoprefixer'], {
            cwd: projectRoot,
            stdio: 'inherit',
            shell: true
        });

        install.on('close', (code) => {
            if (code !== 0) {
                console.error("❌ Failed to install Tailwind dependencies.");
                process.exit(1);
            }

            // 2. Initialize Tailwind
            fs.writeFileSync(path.join(projectRoot, 'tailwind.config.js'), `
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{svelte,js,ts,viand}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
`);

            fs.writeFileSync(path.join(projectRoot, 'postcss.config.js'), `
export default {
  plugins: {
    '@tailwindcss/postcss': {},
    autoprefixer: {},
  },
}
`);

            // 3. Create base CSS
            fs.writeFileSync(path.join(projectRoot, 'src/app.css'), `
@tailwind base;
@tailwind components;
@tailwind utilities;
`);

            console.log(`✅ Tailwind CSS installed and configured.`);
            console.log(`👉 Next step: Add 'import "./app.css"' to your entry Viand or TS file.`);
            process.exit(0);
        });
    } else {
        console.log("Unknown plugin. Supported: tailwind");
    }
}
else {
    console.log("Usage: viand [dev|bake|serve|verify|add] [directory] [plugin]");
}
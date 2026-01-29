#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { processViand } from '../../compiler/src/index.ts';

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
else {
    console.log("Usage: viand [dev|bake|serve] [directory]");
}
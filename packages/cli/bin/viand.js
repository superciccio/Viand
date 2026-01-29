#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { compile } from '../../compiler/src/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log("🌿 Viand CLI v0.1.0");
const args = process.argv.slice(2);

if (args[0] === 'dev') {
    const targetDir = path.resolve(process.cwd(), 'project-test/src');
    
    if (!fs.existsSync(targetDir)) {
        console.error(`❌ Error: Directory not found: ${targetDir}`);
        process.exit(1);
    }

    console.log(`Watching for .viand files in ${targetDir}...`);

    fs.watch(targetDir, { recursive: true }, (eventType, filename) => {
        if (filename && filename.endsWith('.viand')) {
            const filePath = path.join(targetDir, filename);
            if (!fs.existsSync(filePath)) return; // File might have been deleted

            console.log(`🔨 Change detected: ${filename}`);
            try {
                const code = fs.readFileSync(filePath, 'utf-8');
                const svelte = compile(code);
                const outputPath = filePath.replace('.viand', '.svelte');
                fs.writeFileSync(outputPath, svelte);
                console.log(`✅ Recompiled: ${filename} -> .svelte`);
            } catch (e) {
                console.error(`❌ Compilation failed for ${filename}:`);
                console.error(e.message);
            }
        }
    });

    // Keep the process alive
    process.stdin.resume();
} else {
    console.log("Welcome to Viand. Try 'viand dev'");
}
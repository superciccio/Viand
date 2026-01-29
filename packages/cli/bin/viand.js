#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import { processViand } from '../../compiler/src/index.ts';

console.log("🌿 Viand CLI v0.1.0");
const args = process.argv.slice(2);

if (args[0] === 'dev') {
    const projectDir = path.resolve(process.cwd(), 'project-test');
    const srcDir = path.join(projectDir, 'src');
    
    if (!fs.existsSync(projectDir)) {
        console.error(`❌ Error: Project directory not found: ${projectDir}`);
        process.exit(1);
    }

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
                if (logic) {
                    fs.writeFileSync(filePath.replace('.viand', '.viand.logic.svelte.ts'), logic);
                }
                if (tests) {
                    fs.writeFileSync(filePath.replace('.viand', '.test.ts'), tests);
                    console.log(`✅ Generated tests: ${file}`);
                }
            } catch (e) {
                console.error(`❌ Pre-flight failed for ${file}: ${e.message}`);
            }
        }
    });

    console.log(`🚀 Starting Viand Dev Server in ${projectDir}...`);

    const vite = spawn('npm', ['run', 'dev'], { 
        cwd: projectDir, 
        stdio: 'inherit',
        shell: true 
    });

    vite.on('close', (code) => {
        process.exit(code || 0);
    });
} else {
    console.log("Welcome to Viand. Try 'viand dev'");
}

#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { tokenize, analyzeHierarchy } from './src/lexer.ts';
import { transform } from './src/transformer.ts';

const CASES_DIR = './tests/cases';
const PROJECT_SRC = '../../project-test/src';
const PROJECT_DIST = './dist';

/**
 * Phase 1: Run the Gauntlet
 */
async function runGauntlet() {
    console.log("🚀 PHASE 1: RUNNING THE GAUNTLET...");
    const cases = fs.readdirSync(CASES_DIR).filter(f => f.endsWith('.viand'));

    for (const file of cases) {
        const code = fs.readFileSync(path.join(CASES_DIR, file), 'utf-8');
        const isExpectedToFail = file.includes('chaos') || file.includes('mismatch') || file.includes('error');

        try {
            const { tokens, lexerErrors } = tokenize(code);
            const tree = analyzeHierarchy(tokens);
            const svelteOutput = transform(tree, lexerErrors);

            if (!isExpectedToFail) {
                const expectedPath = path.join('./tests/expected', file.replace('.viand', '.svelte'));

                if (fs.existsSync(expectedPath)) {
                    const expectedOutput = fs.readFileSync(expectedPath, 'utf-8');
                    const normalize = (str) => str.replace(/\s+/g, ' ').replace(/>\s+</g, '><').trim();

                    if (normalize(svelteOutput) !== normalize(expectedOutput)) {
                        console.error(`❌ FAIL: ${file} output does not match snapshot!`);
                        console.log("--- ACTUAL ---");
                        console.log(svelteOutput);
                        console.log("--- EXPECTED ---");
                        console.log(expectedOutput);
                        return false;
                    }
                    console.log(`✅ Passed (Snapshot Match): ${file}`);
                } else {
                    console.log(`✅ Passed (Compiled, but no snapshot found): ${file}`);
                }
            }
        } catch (e) {
            if (isExpectedToFail) {
                console.log(`✅ Correctly Blocked (Expected): ${file}`);
            } else {
                console.error(`❌ FAIL: ${file} is clean code but the compiler broke!`);
                console.error(e.message);
                return false;
            }
        }
    }
    return true;
}

/**
 * Phase 2: Build the Project
 */
function buildProject() {
    console.log("\n📦 PHASE 2: BUILDING PROJECT-TEST...");
    if (!fs.existsSync(PROJECT_DIST)) fs.mkdirSync(PROJECT_DIST, { recursive: true });

    const files = fs.readdirSync(PROJECT_SRC).filter(f => f.endsWith('.viand'));

    files.forEach(file => {
        const inputPath = path.join(PROJECT_SRC, file);
        const outputPath = path.join(PROJECT_DIST, file.replace('.viand', '.svelte'));

        const code = fs.readFileSync(inputPath, 'utf-8');
        const { tokens, lexerErrors } = tokenize(code);
        const tree = analyzeHierarchy(tokens);
        const svelte = transform(tree, lexerErrors);

        fs.writeFileSync(outputPath, svelte);
        console.log(`🔨 Compiled: ${file} -> dist/`);
    });
}

(async () => {
    const gauntletSuccess = await runGauntlet();
    if (gauntletSuccess) {
        buildProject();
        console.log("\n✨ ALL SYSTEMS GREEN. Project is ready.");
    } else {
        console.error("\n🛑 BUILD ABORTED: The Gauntlet failed.");
        process.exit(1);
    }
})();

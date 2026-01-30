import fs from 'fs';
import path from 'path';
import { processViand } from '../packages/compiler/src/index.ts';

const source = fs.readFileSync('test.viand', 'utf-8');
const { signals, reports } = processViand(source);

if (reports.length) {
    console.warn("⚠️ COMPILE REPORTS:", reports);
}

// Map the generated Counter to App for the Lab
const code = signals.replace('export function Counter', 'export function App');

fs.writeFileSync('src/App.ts', code);
console.log("✅ Compiled lab/test.viand -> lab/src/App.ts");

import fs from 'fs';
import { processViand } from '../packages/compiler/src/index.ts';
import * as ssr from '../packages/runtime/src/ssr.ts';

// 1. Compile
const source = fs.readFileSync('test.viand', 'utf-8');
const { signals } = processViand(source);

// 2. Hack: Replace runtime import with SSR version for this test
// In a real CLI, we would use an alias or a different build step.
const ssrCode = signals
    .replace(/from "@viand\/runtime"/g, 'from "../../packages/runtime/src/ssr.ts"')
    .replace('export function Counter', 'export function App');

fs.writeFileSync('src/App.ssr.ts', ssrCode);

// 3. Execute and Bake
// We use dynamic import to run the generated code
async function run() {
    const { App } = await import('./src/App.ssr.ts');
    const html = App();
    console.log("🔥 BAKE SUCCESS! Generated HTML:");
    console.log(html);
}

run();

import fs from 'fs';
import { processViand } from '../../compiler/src/index.ts';
import * as ssr from '../../runtime/src/ssr.ts';

/**
 * 🌪️ Viand SSR CLI Helper
 * Executes a .viand file in String Mode and returns the HTML.
 */
export async function renderToHtml(filePath, componentName) {
    const source = fs.readFileSync(filePath, 'utf-8');
    const { signals } = processViand(source);
    
    // We need to execute the generated code. 
    // For this prototype, we'll use a hacky eval or temp file.
    // In production, this would be a proper build worker.
    const tempFile = filePath + '.ssr.tmp.ts';
    let code = signals.replace(/from "@viand\/runtime"/g, 'from "../../packages/runtime/src/ssr.ts"');
    // Map .viand sibling imports to .ssr.tmp.ts so dependencies resolve
    code = code.replace(/from "(\.\.?\/.*)\.viand"/g, 'from "$1.viand.ssr.tmp.ts"');
    
    fs.writeFileSync(tempFile, code);
    
    try {
        const module = await import('file://' + tempFile);
        const html = module[componentName]();
        fs.unlinkSync(tempFile);
        return html;
    } catch (e) {
        if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        throw e;
    }
}

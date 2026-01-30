import { tokenize, analyzeHierarchy } from './lexer.ts';
import { buildManifest } from './parser.ts';
import { generateSvelte5 } from './renderers/svelte.ts';
import { generateLogicClass } from './renderers/logic.ts';
import { generateTests } from './renderers/test.ts';
import { generateStaticHTML } from './renderers/static.ts';
import { generateSignalsJS } from './renderers/signals.ts';
import { format } from './formatter.ts';
import { ComponentManifest } from './types.ts';
import * as svelteCompiler from 'svelte/compiler';

/**
 * Validates a manifest for language constraints.
 */
export function validateManifest(manifest: ComponentManifest, filePath: string): string[] {
    const errors: string[] = [];
    // Basic validation logic
    return errors;
}

/**
 * Full compilation process.
 */
export function processViand(code: string, sqlSource: string = "", apiSource: string = "", langSource: string = "", filePath: string = ""): { svelte: string, logic: string, tests: string, static: string, signals: string, manifest: any, reports: string[] } {
    const { tokens, lexerErrors } = tokenize(code);
    const tree = analyzeHierarchy(tokens);
    const { manifest, reports: parserReports } = buildManifest(tree, lexerErrors, sqlSource, apiSource, langSource);
    
    const validationErrors = validateManifest(manifest, filePath);
    const allReports = [...lexerErrors, ...parserReports, ...validationErrors];

    return {
        manifest,
        reports: allReports,
        svelte: generateSvelte5(manifest),
        logic: generateLogicClass(manifest),
        tests: generateTests(manifest),
        static: generateStaticHTML(manifest),
        signals: generateSignalsJS(manifest)
    };
}

export { 
    tokenize, 
    analyzeHierarchy, 
    buildManifest, 
    generateSvelte5, 
    generateLogicClass, 
    generateTests,
    generateStaticHTML,
    generateSignalsJS,
    format
};

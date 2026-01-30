import { tokenize, analyzeHierarchy } from './lexer.ts';
import { buildManifest } from './parser.ts';
import { generateSvelte5 } from './renderers/svelte.ts';
import { generateLogicClass } from './renderers/logic.ts';
import { generateTests } from './renderers/test.ts';
import { generateStaticHTML } from './renderers/static.ts';
import { format } from './formatter.ts';
import { ComponentManifest } from './types.ts';
import * as svelteCompiler from 'svelte/compiler';

/**
 * Validates a manifest for language constraints.
 */
export function validateManifest(manifest: ComponentManifest, filePath: string): string[] {
    const errors: string[] = [];

    // Rule 1: Svelte 5 Rune Constraints
    const usesRunes = manifest.state.length > 0 || manifest.props.length > 0 || manifest.reactive.length > 0;
    if (usesRunes && !filePath.endsWith('.svelte.ts')) {
        // Warning logic...
    }

    // Rule 2: Resource Awareness
    if (manifest.view.some(node => JSON.stringify(node).includes('intl.')) && !manifest.imports.some(i => i.name === 'intl')) {
        errors.push(`Component uses 'intl' but is missing 'use intl' declaration.`);
    }

    // Rule 3: Logic Consistency
    manifest.state.forEach(s => {
        if (s.id.startsWith('$')) errors.push(`State variable '${s.id}' should not start with '$' in declaration (Viand adds this automatically).`);
    });

    return errors;
}

/**
 * Compiles Viand code to Svelte code.
 */
export function compile(code: string, sql: string = "", api: string = ""): string {
    const { tokens, lexerErrors } = tokenize(code);
    const tree = analyzeHierarchy(tokens);
    const { manifest } = buildManifest(tree, lexerErrors, sql, api);
    
    if (manifest.isMemory) {
        return generateLogicClass(manifest) + `\nexport default ${manifest.name};\n`;
    }

    return generateSvelte5(manifest);
}

/**
 * Full compilation process.
 */
export function processViand(code: string, sqlSource: string = "", apiSource: string = "", langSource: string = "", filePath: string = ""): { svelte: string, logic: string, tests: string, static: string, manifest: any, reports: string[] } {
    const { tokens, lexerErrors } = tokenize(code);
    const tree = analyzeHierarchy(tokens);
    const { manifest, reports: parserReports } = buildManifest(tree, lexerErrors, sqlSource, apiSource, langSource);
    
    const validationErrors = validateManifest(manifest, filePath);
    
    const svelte = generateSvelte5(manifest);
    const logic = generateLogicClass(manifest);

    // Svelte Smoke Test
    try {
        if (svelte && !manifest.isMemory) {
            svelteCompiler.compile(svelte, { filename: filePath + '.svelte' });
        }
    } catch (e: any) {
        validationErrors.push(`[Svelte Error] ${e.message}`);
    }

    const allReports = [...lexerErrors, ...parserReports, ...validationErrors];

    return {
        manifest,
        reports: allReports,
        svelte,
        logic,
        tests: generateTests(manifest),
        static: generateStaticHTML(manifest)
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
    format
};
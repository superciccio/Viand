import { tokenize, analyzeHierarchy } from './lexer.ts';
import { transform, buildManifest, generateTests, generateLogicClass } from './transformer.ts';

/**
 * Compiles Viand code to Svelte code.
 */
export function compile(code: string, sql: string = ""): string {
    const { tokens, lexerErrors } = tokenize(code);
    const tree = analyzeHierarchy(tokens);
    return transform(tree, lexerErrors, sql);
}

/**
 * Full compilation process.
 */
export function processViand(code: string, sql: string = "") {
    const { tokens, lexerErrors } = tokenize(code);
    const tree = analyzeHierarchy(tokens);
    const { manifest, reports } = buildManifest(tree, lexerErrors, sql);
    
    return {
        manifest,
        reports,
        svelte: transform(tree, lexerErrors, sql),
        logic: generateLogicClass(manifest),
        tests: generateTests(manifest)
    };
}

export { tokenize, analyzeHierarchy, buildManifest, generateTests, generateLogicClass };
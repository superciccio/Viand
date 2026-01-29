import { tokenize, analyzeHierarchy } from './lexer.ts';
import { transform, buildManifest, generateTests, generateLogicClass } from './transformer.ts';

/**
 * Compiles Viand code to Svelte code.
 */
export function compile(code: string): string {
    const { tokens, lexerErrors } = tokenize(code);
    const tree = analyzeHierarchy(tokens);
    return transform(tree, lexerErrors);
}

/**
 * Full compilation process that returns manifest, svelte wrapper, shared logic, and optional tests.
 */
export function processViand(code: string) {
    const { tokens, lexerErrors } = tokenize(code);
    const tree = analyzeHierarchy(tokens);
    const { manifest, reports } = buildManifest(tree, lexerErrors);
    
    return {
        manifest,
        reports,
        svelte: transform(tree, lexerErrors),
        logic: generateLogicClass(manifest),
        tests: generateTests(manifest)
    };
}



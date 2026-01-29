import { tokenize, analyzeHierarchy } from './lexer.ts';
import { transform } from './transformer.ts';

/**
 * Compiles Viand code to Svelte code.
 * @param {string} code - The Viand source code.
 * @returns {string} The compiled Svelte code.
 */
export function compile(code: string): string {
    const { tokens, lexerErrors } = tokenize(code);
    const tree = analyzeHierarchy(tokens);
    return transform(tree, lexerErrors);
}

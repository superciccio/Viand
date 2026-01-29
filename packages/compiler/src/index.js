import { tokenize, analyzeHierarchy } from './lexer.js';
import { transform } from './transformer.js';

/**
 * Compiles Viand code to Svelte code.
 * @param {string} code - The Viand source code.
 * @returns {string} The compiled Svelte code.
 */
export function compile(code) {
    const { tokens, lexerErrors } = tokenize(code);
    const tree = analyzeHierarchy(tokens);
    return transform(tree, lexerErrors);
}

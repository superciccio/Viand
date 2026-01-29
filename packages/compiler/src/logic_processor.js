import * as acorn from 'acorn';
import { walk } from 'estree-walker';
import { generate } from 'astring';

const RUNES = ['state', 'derived', 'props', 'effect', 'inspect', 'host'];

/**
 * Robustly cleans Viand logic strings ($var -> var) 
 * while protecting Svelte 5 Runes ($state -> $state).
 */
export function cleanLogic(code) {
    if (!code || typeof code !== 'string') return code;

    // 1. Prepare for parsing: $ is not allowed in most JS identifiers as a prefix
    // unless followed by specific characters. To be safe, we swap $ for a valid prefix.
    const preparedCode = code.replace(/\$([a-zA-Z0-9_]+)/g, '__VIAND_VAR_$1');

    try {
        // 2. Parse the code into an AST
        // We use 'expression' mode if possible, but 'script' is safer for general logic.
        const ast = acorn.parse(preparedCode, { 
            ecmaVersion: 'latest', 
            sourceType: 'module' 
        });

        // 3. Walk and Transform
        walk(ast, {
            enter(node) {
                if (node.type === 'Identifier' && node.name.startsWith('__VIAND_VAR_')) {
                    const originalName = node.name.replace('__VIAND_VAR_', '');
                    
                    if (RUNES.includes(originalName)) {
                        node.name = '$' + originalName; // Restore Rune
                    } else {
                        node.name = originalName; // Strip $ from regular var
                    }
                }
            }
        });

        // 4. Generate back to string
        // We trim the result and remove trailing semicolon if it was an expression
        let result = generate(ast).trim();
        if (result.endsWith(';') && !code.trim().endsWith(';')) {
            result = result.slice(0, -1);
        }
        
        return result;
    } catch (e) {
        // Fallback to regex if Acorn fails (for partial/malformed strings during typing)
        return code.replace(/\$([a-zA-Z0-9_]+)/g, (match, p1) => {
            return RUNES.includes(p1) ? match : p1;
        });
    }
}

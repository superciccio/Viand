import { tokenize, analyzeHierarchy } from './lexer.ts';

/**
 * The Viand Executive Formatter.
 * Takes raw code and re-emits it according to the language standard.
 */
export function format(code: string): string {
    const { tokens } = tokenize(code);
    const tree = analyzeHierarchy(tokens);
    
    let formatted = "";
    
    tree.forEach(token => {
        const indent = " ".repeat(token.depth * 4);
        let content = token.content.trim();

        // 1. Spacing around arrows
        content = content.replace(/\s*->\s*/g, ' -> ');

        // 2. Quote Normalization (Executive preference: Single for attrs, Double for prose)
        // This is complex to do via regex, but we can do basic cleanup.
        
        // 3. Redundant Colons
        // If it's a UI element and ends with ':' but has no children...
        // Actually, we keep colons if the user wanted them, but we could enforce a style.

        formatted += `${indent}${content}\n`;
    });

    return formatted.trim() + "\n";
}

import { Token, TokenType } from './types';

export function identifyToken(content: string): TokenType {
    const trimmed = content.trim();
    
    if (trimmed.startsWith('component')) return 'COMPONENT_DECL';
    if (trimmed.startsWith('view:')) return 'VIEW_ROOT';
    if (trimmed.startsWith('style:')) return 'STYLE_ROOT';
    if (trimmed.startsWith('$')) return 'STATE_VARIABLE';
    if (trimmed.startsWith('@prop')) return 'PROP_DECLARATION';
    if (trimmed.startsWith('sync ')) return 'REACTIVE_DECLARATION';
    if (trimmed.startsWith('use ')) return 'IMPORT_DECLARATION';
    if (trimmed.startsWith('fn ')) return 'FUNCTION_ACTION';
    
    if (trimmed.startsWith('each ') || 
        trimmed.startsWith('if ') || 
        trimmed.startsWith('else') || 
        trimmed.startsWith('match ') || 
        trimmed.startsWith('case ') || 
        trimmed.startsWith('default')) {
        return 'CONTROL_FLOW';
    }
    
    if (trimmed.includes(':') || trimmed.includes('(')) {
        return 'UI_ELEMENT';
    }
    
    return 'EXPRESSION';
}

export function tokenize(code: string) {
    const lines = code.split('\n');
    const tokens: Token[] = [];
    const lexerErrors: string[] = [];

    lines.forEach((line, index) => {
        const lineNum = index + 1;
        const indentMatch = line.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[0].length : 0;
        
        const content = line.split('//')[0].trim();
        if (!content) return;

        if (indent % 4 !== 0) {
            lexerErrors.push(`Line ${lineNum}: Indentation Error (Used ${indent} spaces, must be multiple of 4)`);
        }

        const type = identifyToken(content);
        tokens.push({ 
            line: lineNum, 
            indent,
            type, 
            content,
            raw: line.trim(),
            depth: 0 // Will be set by analyzeHierarchy
        });
    });

    return { tokens, lexerErrors };
}

export function analyzeHierarchy(tokens: Token[]): Token[] {
    const stack = [0];
    return tokens.map(token => {
        const currentIndent = token.indent;
        const topOfStack = stack[stack.length - 1];

        if (currentIndent > topOfStack) {
            stack.push(currentIndent);
        } else if (currentIndent < topOfStack) {
            while (stack.length > 0 && stack[stack.length - 1] > currentIndent) {
                stack.pop();
            }
        }
        token.depth = stack.length - 1;
        return token;
    });
}

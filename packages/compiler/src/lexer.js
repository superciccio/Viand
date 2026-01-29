const SYMBOL_MAP = {
    '$': 'STATE_VARIABLE',
    '@': 'PLATFORM_BRIDGE'
};

export function identifyToken(content) {
    const trimmed = content.trim();
    
    // 1. State/Props/Keywords (Check these first!)
    if (trimmed.startsWith('$')) return 'STATE_VARIABLE';
    if (trimmed.startsWith('@prop')) return 'PROP_DECLARATION';
    if (trimmed.startsWith('sync ')) return 'REACTIVE_DECLARATION';
    if (trimmed.startsWith('use ')) return 'IMPORT_DECLARATION';
    if (trimmed.startsWith('fn ')) return 'FUNCTION_ACTION';
    if (trimmed.startsWith('component')) return 'COMPONENT_DECL';
    if (trimmed.startsWith('view:')) return 'VIEW_ROOT';
    if (trimmed.startsWith('style:')) return 'STYLE_ROOT';
    if (trimmed.startsWith('each ') || trimmed.startsWith('if ') || trimmed.startsWith('else') || trimmed.startsWith('match ') || trimmed.startsWith('case ') || trimmed.startsWith('default')) return 'CONTROL_FLOW';
    
    // 2. UI Elements
    // Check for colon OR parentheses (for attributes like input(...))
    if (trimmed.includes(':') || trimmed.includes('(')) {
        // Double check it's not a malformed state variable that missed the $
        return 'UI_ELEMENT';
    }
    
    return 'EXPRESSION';
}

export function tokenize(code) {
    const lines = code.split('\n');
    const tokens = [];
    const lexerErrors = [];

    lines.forEach((line, index) => {
        const lineNum = index + 1;
        const indentMatch = line.match(/^(\s*)/);
        const indent = indentMatch ? indentMatch[0].length : 0;
        
        // Strip comments for processing but keep them for user context if needed
        const content = line.split('//')[0].trim();
        if (!content) return;

        // LAW: Indent must be multiple of 4
        if (indent % 4 !== 0) {
            lexerErrors.push(`Line ${lineNum}: Indentation Error (Used ${indent} spaces, must be multiple of 4)`);
        }

        const type = identifyToken(content);
        console.log(`LEXER DEBUG: [${type}] -> ${line}`); // ADD THIS LINE
        tokens.push({ 
            line: lineNum, 
            indent, 
            type, 
            content,
            raw: line.trim() // Keep the raw line for error reporting
        });
    });

    return { tokens, lexerErrors };
}

export function analyzeHierarchy(tokens) {
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
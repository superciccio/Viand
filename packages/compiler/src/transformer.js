/**
 * Static Type Validation Law
 */
function validateTypeAssignment(name, type, value, line, reports) {
    const val = value?.trim() || "";
    
    if (type === 'any') {
        console.warn(`⚠️  Warning at Line ${line}: Using "any" defeats the purpose of Viand. Be careful!`);
        return;
    }

    if (type === 'array') {
        const isArrayLiteral = val.startsWith('[') && val.endsWith(']');
        const isVarReference = val.startsWith('$');
        if (!isArrayLiteral && !isVarReference) {
             reports.push(`Line ${line}: Type Error. "$${name}" is declared as array but assigned a non-array value.`);
        }
    }

    if (type === 'number') {
        const isStringLiteral = val.startsWith('"') || val.startsWith("'");
        if (isStringLiteral || (isNaN(val) && !val.startsWith('$'))) {
            reports.push(`Line ${line}: Type Error. "$${name}" is declared as number but assigned "${val}".`);
        }
    }
    if (type === 'string') {
        const isStringLiteral = val.startsWith('"') || val.startsWith("'");
        const isVarReference = val.startsWith('$');
        const isConcatenation = val.includes('+');
        if (!isStringLiteral && !isVarReference && !isConcatenation) {
            reports.push(`Line ${line}: Type Error. "$${name}" is declared as string but assigned a non-string value.`);
        }
    }
}

/**
 * Helper to strip quotes and convert $var to {var} for Svelte prose
 */
function cleanViandText(text) {
    let cleaned = text.trim();
    cleaned = cleaned.replace(/["']\s*\+\s*/g, '').replace(/\+\s*["']/g, '').replace(/["']/g, '');         
    cleaned = cleaned.replace(/\$([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)/g, '{$1}');
    return cleaned;
}

/**
 * Helper to strip $ for logic expressions (if/each)
 */
function cleanLogicExpression(text) {
    return text.trim().replace(/\$([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)*)/g, '$1');
}

function findSplitColon(text) {
    let depth = 0;
    let inQuote = false;
    let quoteChar = null;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (inQuote) {
            if (char === quoteChar) {
                inQuote = false;
            }
        } else {
            if (char === '"' || char === "'") {
                inQuote = true;
                quoteChar = char;
            } else if (char === '(') depth++;
            else if (char === ')') depth--;
            else if (char === ':' && depth === 0) return i;
        }
    }
    return -1;
}

export function transform(tree, lexerErrors = []) {
    const reports = [...lexerErrors];
    let scriptBlock = "";
    let viewBlock = "";
    let styleBlock = "";
    let tagStack = [];

    if (!tree.some(t => t.type === 'VIEW_ROOT')) {
        reports.push("Structure Error: Missing 'view:' block.");
    }

    for (let i = 0; i < tree.length; i++) {
        const token = tree[i];
        const nextToken = tree[i + 1];

        // --- CONTEXT CHECK ---
        const isStyle = tagStack.some(s => s.type === 'STYLE_CONTEXT' || s.type === 'STYLE_RULE');
        const isInsideFunction = tagStack.some(s => s.name === 'FUNCTION_CLOSURE' || s.type === 'JS_BLOCK');

        // 1. HIGH-PRIORITY KEYWORDS (Imports, Props, State, Reactive, Functions, StyleRoot)
        // These should always be parsed regardless of context (except perhaps Functions)
        
        if (token.type === 'IMPORT_DECLARATION') {
            const importMatch = token.content.match(/use\s+(\w+)\s+from\s+["'](.*)\.viand["']/);
            if (importMatch) {
                const [_, name, path] = importMatch;
                scriptBlock += `  import ${name} from "${path}.svelte";\n`;
            }
            continue;
        }

        if (token.type === 'PROP_DECLARATION') {
            const propMatch = token.content.match(/@prop\s+\$?([a-z_]\w*)\s*(?::\s*([a-z]+))?\s*(?:=\s*(.*))?/i);
            if (propMatch) {
                const [_, name, type, value] = propMatch;
                const tsType = type === 'array' ? 'any[]' : type;
                scriptBlock += `  export let ${name}${tsType ? `: ${tsType}` : ""} = ${value || 'undefined'};
`;
            }
            continue;
        }

        if (token.type === 'STATE_VARIABLE') {
            if (isInsideFunction) {
                scriptBlock += `    ${cleanLogicExpression(token.content)};\n`;
            } else {
                const typeMatch = token.content.match(/^\$([a-z_]\w*)\s*(?::\s*([a-z]+))?\s*=\s*(.*)/i);
                if (typeMatch) {
                    const [_, name, type, value] = typeMatch;
                    if (type) validateTypeAssignment(name, type, value, token.line, reports);
                    const tsType = type === 'array' ? 'any[]' : type;
                    scriptBlock += `  let ${name}${tsType ? `: ${tsType}` : ""} = ${value};
`;
                }
            }
            continue;
        }

        if (token.type === 'REACTIVE_DECLARATION') {
            const syncMatch = token.content.match(/^sync\s+\$([a-z_]\w*)\s*=\s*(.*)/i);
            if (syncMatch) {
                const [_, name, value] = syncMatch;
                scriptBlock += `  $: ${name} = ${cleanLogicExpression(value)};\n`;
            }
            continue;
        }

        if (token.type === 'FUNCTION_ACTION') {
            const funcMatch = token.content.match(/fn\s+(\w+)\s*\((.*?)\)/);
            if (funcMatch) {
                const [_, name, params] = funcMatch;
                scriptBlock += `  function ${name}(${params}) {
`;
                tagStack.push({ name: 'FUNCTION_CLOSURE', type: 'JS_BLOCK', depth: token.depth });
            }
            continue;
        }

        if (token.type === 'STYLE_ROOT') {
            tagStack.push({ name: 'style', type: 'STYLE_CONTEXT', depth: token.depth });
            continue;
        }

        if (token.type === 'VIEW_ROOT') {
            continue; 
        }

        // 2. CONTEXT-SPECIFIC CONTENT
        if (isStyle) {
            if (token.type === 'EXPRESSION' && token.depth > 0) {
                const indent = "  ".repeat(token.depth / 4);
                if (token.content.endsWith(':')) {
                    styleBlock += `${indent}${token.content.slice(0, -1)} {\n`;
                    tagStack.push({ name: 'css-rule', type: 'STYLE_RULE', depth: token.depth });
                } else {
                    styleBlock += `${indent}${token.content};\n`;
                }
            }
            // Fall through to auto-closing
        } else {
            // 3. VIEW MODE (Control Flow & Elements)
            if (token.type === 'CONTROL_FLOW') {
                const indent = "  ".repeat(token.depth / 4);
                const eachMatch = token.content.match(/each\s+\$([a-z_]\w*)\s+in\s+\$([a-z_]\w*)/i);
                if (eachMatch) {
                    const [_, itemVar, listVar] = eachMatch;
                    viewBlock += `${indent}{#each ${listVar} as ${itemVar}}\n`;
                    tagStack.push({ name: 'each', type: 'SVELTE_BLOCK', depth: token.depth });
                    continue;
                }
                if (token.content.startsWith('match ')) {
                    const varName = cleanLogicExpression(token.content.replace('match ', '').replace(':', ''));
                    tagStack.push({ name: 'match', type: 'MATCH_ROOT', var: varName, hasStarted: false, depth: token.depth });
                    continue;
                }
                if (token.content.startsWith('case ')) {
                    const parent = tagStack[tagStack.length - 1];
                    if (parent && parent.type === 'MATCH_ROOT') {
                        const val = cleanLogicExpression(token.content.replace('case ', '').replace(':', ''));
                        if (!parent.hasStarted) {
                            viewBlock += `${indent}{#if ${parent.var} === ${val}}\n`;
                            parent.hasStarted = true;
                        } else {
                            viewBlock += `${indent}{:else if ${parent.var} === ${val}}\n`;
                        }
                    }
                    continue;
                }
                if (token.content.startsWith('default')) {
                    viewBlock += `${indent}{:else}\n`;
                    continue;
                }
                if (token.content.startsWith('if ')) {
                    const condition = cleanLogicExpression(token.content.replace('if ', '').replace(':', ''));
                    if (isInsideFunction) {
                        scriptBlock += `${indent}  if (${condition}) {\n`;
                        tagStack.push({ name: 'if', type: 'JS_BLOCK', depth: token.depth });
                    } else {
                        viewBlock += `${indent}{#if ${condition}}\n`;
                        tagStack.push({ name: 'if', type: 'SVELTE_BLOCK', depth: token.depth });
                    }
                    continue;
                }
                if (token.content.startsWith('else if ')) {
                    const condition = cleanLogicExpression(token.content.replace('else if ', '').replace(':', ''));
                    if (isInsideFunction) scriptBlock += `${indent}  else if (${condition}) {\n`;
                    else viewBlock += `${indent}{:else if ${condition}}\n`;
                    continue;
                }
                if (token.content.startsWith('else')) {
                    if (isInsideFunction) scriptBlock += `${indent}  else {\n`;
                    else viewBlock += `${indent}{:else}\n`;
                    continue;
                }
            }

            if (token.type === 'UI_ELEMENT') {
                const colonIndex = findSplitColon(token.content);
                const hasColon = colonIndex !== -1;
                const fullContent = hasColon ? token.content.slice(0, colonIndex).trim() : token.content.trim();
                const inlineContent = hasColon ? token.content.slice(colonIndex + 1).trim() : "";
                const indent = "  ".repeat(token.depth / 4);

                let tagSide = fullContent;
                let eventSide = "";
                let eventAttr = "";

                if (fullContent.includes('->')) {
                    const parts = fullContent.split('->');
                    tagSide = parts[0].trim();
                    eventSide = parts[1].trim();
                }

                let attrString = "";
                let tagNameAndClasses = tagSide;
                const startParen = tagSide.indexOf('(');
                const endParen = tagSide.lastIndexOf(')');
                
                if (startParen !== -1 && endParen !== -1) {
                    const rawAttrs = tagSide.slice(startParen + 1, endParen);
                    tagNameAndClasses = tagSide.slice(0, startParen) + tagSide.slice(endParen + 1);
                    attrString = " " + rawAttrs.split(',').map(p => {
                        const parts = p.split(':');
                        if (parts.length < 2) return "";
                        let k = parts[0].trim();
                        let vParts = parts.slice(1);
                        if ((k === 'bind' || k === 'class' || k === 'style') && vParts.length > 0) k += ':' + vParts.shift().trim();
                        const v = vParts.join(':').trim();
                        let cleanV = v;
                        if (v.startsWith('$')) cleanV = `{${v.slice(1)}}`;
                        else if (v === 'true' || v === 'false') cleanV = `{${v}}`;
                        return `${k}=${cleanV}`;
                    }).filter(s => s !== "").join(' ');
                }

                const tagName = tagNameAndClasses.split(/[ .]+/)[0].trim();
                const classes = tagNameAndClasses.match(/\.([a-z0-9_-]+)/gi)?.map(c => c.slice(1)).join(' ') || "";
                const classAttr = classes ? ` class="${classes}"` : "";

                if (eventSide) {
                    const explicitMatch = eventSide.match(/^([a-z0-9_\.]+)\s*\((.*?)\)$/i);
                    if (explicitMatch) {
                         const [_, evtName, handler] = explicitMatch;
                         if (!handler.trim()) eventAttr = ` on:click={${evtName}}`;
                         else {
                             const svelteEvt = evtName.replace(/\./g, '|');
                             eventAttr = ` on:${svelteEvt}={${handler}}`;
                         }
                    } else {
                         const handler = eventSide.replace('()', '').trim();
                         eventAttr = ` on:click={${handler}}`;
                    }
                }

                const isComponent = /^[A-Z]/.test(tagName);
                const isSelfClosing = ['input', 'img', 'br', 'hr'].includes(tagName.toLowerCase());

                if (isComponent) {
                    viewBlock += `${indent}<${tagName}${attrString} />\n`;
                } else if (isSelfClosing) {
                    viewBlock += `${indent}<${tagName}${classAttr}${eventAttr}${attrString} />\n`;
                } else {
                    let openingTag = `${indent}<${tagName}${classAttr}${eventAttr}${attrString}>`.replace(/\s+/g, ' ').replace(' >', '>');
                    viewBlock += openingTag;
                    if (inlineContent) viewBlock += `${cleanViandText(inlineContent)}</${tagName}>\n`;
                    else {
                        viewBlock += `\n`;
                        tagStack.push({ name: tagName, type: 'HTML_TAG', depth: token.depth });
                    }
                }
                continue;
            }

            if (token.type === 'EXPRESSION' && token.depth > 0) {
                if (isInsideFunction) scriptBlock += `${"  ".repeat(token.depth / 4)}${cleanLogicExpression(token.content)}\n`;
                else viewBlock += `${"  ".repeat(token.depth / 4)}${cleanViandText(token.content)}\n`;
            }
        }

        // --- AUTO-CLOSING ---
        if (nextToken) {
            while (tagStack.length > 0 && tagStack[tagStack.length - 1].depth >= nextToken.depth) {
                const closing = tagStack.pop();
                if (closing.name === 'if' && nextToken.content.trim().startsWith('else')) {
                    tagStack.push(closing);
                    break;
                }

                if (closing.type === 'JS_BLOCK') scriptBlock += `${"  ".repeat(closing.depth / 4)}}
`;
                else if (closing.type === 'SVELTE_BLOCK') viewBlock += `${"  ".repeat(closing.depth / 4)}{/${closing.name}}\n`;
                else if (closing.type === 'MATCH_ROOT') viewBlock += `${"  ".repeat(closing.depth / 4)}{/if}\n`;
                else if (closing.type === 'STYLE_RULE') styleBlock += `${"  ".repeat(closing.depth / 4)}}
`;
                else if (closing.type === 'STYLE_CONTEXT') {} 
                else viewBlock += `${"  ".repeat(closing.depth / 4)}</${closing.name}>\n`;
            }
        }
    }

    while (tagStack.length > 0) {
        const closing = tagStack.pop();
        if (closing.type === 'JS_BLOCK') scriptBlock += `${"  ".repeat(closing.depth / 4)}}
`;
        else if (closing.type === 'SVELTE_BLOCK') viewBlock += `${"  ".repeat(closing.depth / 4)}{/${closing.name}}\n`;
        else if (closing.type === 'MATCH_ROOT') viewBlock += `${"  ".repeat(closing.depth / 4)}{/if}\n`;
        else if (closing.type === 'STYLE_RULE') styleBlock += `${"  ".repeat(closing.depth / 4)}}
`;
        else if (closing.type === 'STYLE_CONTEXT') {} 
        else viewBlock += `${"  ".repeat(closing.depth / 4)}</${closing.name}>\n`;
    }

    if (reports.length > 0) {
        console.error("\n🚫 VIAND COMPILER SCREAMED (" + reports.length + " issues):");
        reports.forEach(err => console.error(`   -> ${err}`));
        throw new Error("Compilation failed.");
    }

    const svelteStyle = styleBlock ? `\n<style>\n${styleBlock}</style>\n` : "";
    return `<script lang="ts">\n${scriptBlock}</script>\n\n${viewBlock}${svelteStyle}`;
}

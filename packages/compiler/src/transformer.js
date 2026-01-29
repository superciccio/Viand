import { createComponentManifest, ViewNode } from './manifest.js';

/**
 * Helper to strip quotes and convert $var to {var} for Svelte prose
 */
function cleanViandText(text) {
    if (typeof text !== 'string') return text;
    let cleaned = text.trim();
    // Handle concatenation like "Welcome " + $user
    cleaned = cleaned.replace(/["']\s*\+\s*/g, '').replace(/\+\s*["']/g, '').replace(/["']/g, '');         
    // Interpolate variables: $user -> {user}
    cleaned = cleaned.replace(/\$([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_.]+)*)/g, '{$1}');
    return cleaned;
}

/**
 * Helper to strip $ for logic expressions (if/each/js)
 * PROTECTS Svelte 5 Runes ($state, $derived, etc)
 */
function cleanLogicExpression(text) {
    if (typeof text !== 'string') return text;
    const runes = ['state', 'derived', 'props', 'effect', 'inspect', 'host'];
    // Match $ followed by a variable name (including dots for property access)
    return text.replace(/\$([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_.]+)*)/g, (match, p1) => {
        // If the variable name is a Svelte Rune, keep the $
        const root = p1.split('.')[0];
        if (runes.includes(root)) return match;
        // Otherwise, strip the $
        return p1;
    });
}

function findSplitColon(text) {
    let depth = 0;
    let inQuote = false;
    let quoteChar = null;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (inQuote) { if (char === quoteChar) inQuote = false; } else {
            if (char === '"' || char === "'") { inQuote = true; quoteChar = char; }
            else if (char === '(') depth++;
            else if (char === ')') depth--;
            else if (char === ':' && depth === 0) return i;
        }
    }
    return -1;
}

/**
 * PHASE 1: BUILDER (Tokens -> Manifest)
 */
function buildManifest(tree, lexerErrors) {
    const manifest = createComponentManifest();
    const reports = [...lexerErrors];
    const stack = [{ type: 'root', children: manifest.view, depth: -1 }]; 

    for (let i = 0; i < tree.length; i++) {
        const token = tree[i];
        const trimmed = token.content.trim();

        if (token.type === 'COMPONENT_DECL') {
            const match = trimmed.match(/component\s+(\w+)/);
            if (match) manifest.name = match[1];
            continue;
        }

        if (token.type === 'IMPORT_DECLARATION') {
            const match = trimmed.match(/use\s+(\w+)\s+from\s+["'](.*?)["']/);
            if (match) manifest.imports.push({ name: match[1], path: match[2] });
            continue;
        }

        if (token.type === 'PROP_DECLARATION') {
            const match = trimmed.match(/@prop\s+\$?([a-z_]\w*)/i);
            if (match) {
                const id = match[1];
                let type = 'any';
                let value = 'undefined';
                const typeMatch = trimmed.match(/:\s*([a-z0-9_[\]]+)/i);
                if (typeMatch) type = typeMatch[1];
                const valMatch = trimmed.match(/=\s*(.*)$/);
                if (valMatch) value = valMatch[1].trim();
                manifest.props.push({ id, type, value });
            }
            continue;
        }

        if (token.type === 'STATE_VARIABLE') {
            const context = stack[stack.length - 1];
            const isInsideScript = context.type === 'function' || context.type === 'js-block';
            
            if (isInsideScript) {
                context.body.push(token.content);
            } else {
                const match = trimmed.match(/^\$([a-z_]\w*)/i);
                if (match) {
                    const id = match[1];
                    let type = 'any';
                    let value = 'undefined';
                    const typeMatch = trimmed.match(/:\s*([a-z0-9_[\]]+)/i);
                    if (typeMatch) type = typeMatch[1];
                    const valMatch = trimmed.match(/=\s*(.*)$/);
                    if (valMatch) value = valMatch[1].trim();
                    manifest.state.push({ id, type, value });
                }
            }
            continue;
        }

        if (token.type === 'REACTIVE_DECLARATION') {
            const match = trimmed.match(/^sync\s+\$([a-z_]\w*)\s*=\s*(.*)/i);
            if (match) manifest.reactive.push({ id: match[1], expression: match[2] });
            continue;
        }

        if (token.type === 'FUNCTION_ACTION') {
            const match = trimmed.match(/fn\s+(\w+)\s*\((.*?)\)/);
            if (match) {
                const func = { type: 'function', name: match[1], params: match[2].split(',').map(p => p.trim()).filter(p => p), body: [], depth: token.depth };
                manifest.functions.push(func);
                stack.push(func);
            }
            continue;
        }

        if (token.type === 'STYLE_ROOT') {
            stack.push({ type: 'style', depth: token.depth });
            continue;
        }

        // 2. HIERARCHY MANAGEMENT
        while (stack.length > 1 && token.depth <= stack[stack.length - 1].depth) {
            stack.pop();
        }

        const currentContext = stack[stack.length - 1];

        // 3. CONTEXT-SPECIFIC PARSING
        if (currentContext.type === 'style' || currentContext.type === 'style-rule') {
            if (trimmed.endsWith(':')) {
                const rule = { selector: trimmed.slice(0, -1), rules: [] };
                manifest.styles.push(rule);
                stack.push({ type: 'style-rule', rule, depth: token.depth });
            } else {
                const ruleContext = [...stack].reverse().find(s => s.type === 'style-rule');
                if (ruleContext) ruleContext.rule.rules.push(trimmed);
            }
            continue;
        }

        if (currentContext.type === 'function' || currentContext.type === 'js-block') {
            if (token.type === 'CONTROL_FLOW' && trimmed.startsWith('if ')) {
                const block = { type: 'js-block', body: [trimmed], depth: token.depth };
                currentContext.body.push(block);
                stack.push(block);
            } else {
                currentContext.body.push(token.content);
            }
            continue;
        }

        // 4. VIEW TREE CONSTRUCTION
        if (token.type === 'CONTROL_FLOW') {
            if (trimmed.startsWith('each ')) {
                const match = trimmed.match(/each\s+\$([a-z_]\w*)\s+in\s+\$([a-z_]\w*)/i);
                if (match) {
                    const node = ViewNode.each(match[2], match[1]);
                    currentContext.children.push(node);
                    stack.push({ type: 'view-node', children: node.children, depth: token.depth });
                }
            } else if (trimmed.startsWith('match ')) {
                const varName = trimmed.replace('match ', '').replace(':', '').trim();
                const node = ViewNode.match(varName);
                currentContext.children.push(node);
                stack.push({ type: 'match-root', node, depth: token.depth });
            } else if (trimmed.startsWith('case ') && currentContext.type === 'match-root') {
                const val = trimmed.replace('case ', '').replace(':', '').trim();
                const caseNode = { condition: val, children: [] };
                currentContext.node.cases.push(caseNode);
                stack.push({ type: 'view-node', children: caseNode.children, depth: token.depth });
            } else if (trimmed.startsWith('default') && currentContext.type === 'match-root') {
                const defaultNode = { children: [] };
                currentContext.node.defaultCase = defaultNode;
                stack.push({ type: 'view-node', children: defaultNode.children, depth: token.depth });
            } else if (trimmed.startsWith('if ')) {
                const node = ViewNode.if(trimmed.replace('if ', '').replace(':', '').trim());
                currentContext.children.push(node);
                stack.push({ type: 'view-node', children: node.children, depth: token.depth, node });
            } else if (trimmed.startsWith('else')) {
                const lastNode = currentContext.children[currentContext.children.length - 1];
                if (lastNode && lastNode.type === 'if') {
                    const node = ViewNode.if(trimmed.startsWith('else if ') ? trimmed.replace('else if ', '').replace(':', '').trim() : 'true');
                    lastNode.alternate = node;
                    stack.push({ type: 'view-node', children: node.children, depth: token.depth });
                }
            }
            continue;
        }

        if (token.type === 'UI_ELEMENT') {
            const colonIndex = findSplitColon(trimmed);
            const hasColon = colonIndex !== -1;
            const fullTagPart = hasColon ? trimmed.slice(0, colonIndex).trim() : trimmed.trim();
            const inlineContent = hasColon ? trimmed.slice(colonIndex + 1).trim() : "";

            let tagSide = fullTagPart;
            let eventSide = "";
            if (fullTagPart.includes('->')) {
                const parts = fullTagPart.split('->');
                tagSide = parts[0].trim();
                eventSide = parts[1].trim();
            }

            const startParen = tagSide.indexOf('(');
            const endParen = tagSide.lastIndexOf(')');
            let tag = tagSide;
            let attrs = {};

            if (startParen !== -1 && endParen !== -1) {
                tag = tagSide.slice(0, startParen).trim();
                const rawAttrs = tagSide.slice(startParen + 1, endParen);
                rawAttrs.split(',').forEach(p => {
                    const parts = p.split(':');
                    if (parts.length >= 2) {
                        let k = parts[0].trim();
                        let vParts = parts.slice(1);
                        if (['bind', 'class', 'style'].includes(k)) k += ':' + vParts.shift().trim();
                        attrs[k] = vParts.join(':').trim();
                    }
                });
            }

            const tagParts = tag.split('.');
            const actualTag = tagParts[0].trim();
            if (tagParts.length > 1) attrs['class'] = tagParts.slice(1).join(' ').trim();

            if (eventSide) {
                const match = eventSide.match(/^([a-z0-9_.]+)\s*\((.*?)\)$/i);
                if (match) {
                    if (!match[2].trim()) attrs['on:click'] = match[1];
                    else attrs[`on:${match[1].replace(/\./g, '|')}`] = match[2];
                } else {
                    attrs['on:click'] = eventSide.replace('()', '').trim();
                }
            }

            const node = ViewNode.element(actualTag, attrs);
            currentContext.children.push(node);
            
            if (inlineContent) {
                node.children.push(ViewNode.text(inlineContent));
            } else if (trimmed.endsWith(':')) {
                stack.push({ type: 'view-node', children: node.children, depth: token.depth });
            }
            continue;
        }

        if (token.type === 'EXPRESSION' && token.depth > 0 && trimmed !== 'view:') {
            currentContext.children.push(ViewNode.text(trimmed));
        }
    }

    return { manifest, reports };
}

/**
 * PHASE 2: GENERATOR (Manifest -> Svelte 5)
 */
function generateSvelte5(manifest) {
    let script = `<script lang="ts">
`;

    if (manifest.imports.length > 0) {
        manifest.imports.forEach(i => {
            script += `  import ${i.name} from "${i.path}";
`;
        });
    }

    if (manifest.props.length > 0) {
        script += `  let { ${manifest.props.map(p => `${p.id} = $bindable(${p.value})`).join(', ')} } = $props();\n`;
    }

    manifest.state.forEach(s => {
        const tsType = s.type === 'array' ? 'any[]' : s.type;
        script += `  let ${s.id}: ${tsType} = $state(${s.value});
`;
    });

    manifest.reactive.forEach(r => {
        script += `  let ${r.id} = $derived(${cleanLogicExpression(r.expression)});
`;
    });

    manifest.functions.forEach(f => {
        script += `
  function ${f.name}(${f.params.join(', ')}) {
`;
        const renderBody = (body, indent = "    ") => {
            return body.map(line => {
                if (typeof line === 'string') return `${indent}${cleanLogicExpression(line)};\n`;
                // Transform Viand 'if cond:' -> JS 'if (cond) {'
                const rawHeader = line.body[0].trim();
                const jsHeader = rawHeader.replace(/^if\s+(.*):$/, 'if ($1) {');
                const header = cleanLogicExpression(jsHeader);
                return `${indent}${header}\n${renderBody(line.body.slice(1), indent + "  ")}${indent}}\n`;
            }).join('');
        };
        script += renderBody(f.body);
        script += `  }
`;
    });

    script += `</script>

`;

    const renderNode = (node, indent = "") => {
        if (node.type === 'text') return `${indent}${cleanViandText(node.content)}\n`;
        
        if (node.type === 'element') {
            const attrParts = Object.entries(node.attrs).map(([k, v]) => {
                let val;
                if (v.startsWith('$')) val = `{${v.slice(1)}}`;
                else if (k.startsWith('on:')) val = `{${v}}`;
                else if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'" ) && v.endsWith("'" ))) val = v;
                else val = `"${v}"`;
                return `${k}=${val}`;
            });
            const attrString = attrParts.length > 0 ? ' ' + attrParts.join(' ') : '';
            
            const isSelfClosing = ['input', 'img', 'br', 'hr'].includes(node.tag.toLowerCase());
            if (isSelfClosing) return `${indent}<${node.tag}${attrString} />\n`;
            
            return `${indent}<${node.tag}${attrString}>
${node.children.map(c => renderNode(c, indent + "  ")).join('')}${indent}</${node.tag}>
`;
        }

        if (node.type === 'each') {
            const list = cleanLogicExpression(node.list);
            const item = cleanLogicExpression(node.item);
            return `${indent}{#each ${list} as ${item}}
${node.children.map(c => renderNode(c, indent + "  ")).join('')}${indent}{/each}
`;
        }

        if (node.type === 'if') {
            let out = `${indent}{#if ${cleanLogicExpression(node.condition)}}
${node.children.map(c => renderNode(c, indent + "  ")).join('')}`;
            if (node.alternate) {
                if (node.alternate.condition === 'true') out += `${indent}{:else}
${node.alternate.children.map(c => renderNode(c, indent + "  ")).join('')}`;
                else out += `${indent}{:else if ${cleanLogicExpression(node.alternate.condition)}}
${node.alternate.children.map(c => renderNode(c, indent + "  ")).join('')}`;
            }
            return out + `${indent}{/if}
`;
        }

        if (node.type === 'match') {
            const expr = cleanLogicExpression(node.expression);
            let out = "";
            node.cases.forEach((c, i) => {
                const header = i === 0 ? `{#if ${expr} === ${c.condition}}` : `{:else if ${expr} === ${c.condition}}`;
                out += `${indent}${header}\n${c.children.map(child => renderNode(child, indent + "  ")).join('')}`;
            });
            if (node.defaultCase) {
                out += `${indent}{:else}
${node.defaultCase.children.map(child => renderNode(child, indent + "  ")).join('')}`;
            }
            out += `${indent}{/if}\n`;
            return out;
        }
    };

    const finalView = manifest.view.map(n => renderNode(n)).join('');

    let style = "";
    if (manifest.styles.length > 0) {
        style = `\n<style>\n`;
        manifest.styles.forEach(s => {
            style += `  ${s.selector} {
`;
            s.rules.forEach(r => style += `    ${r};\n`);
            style += `  }
`;
        });
        style += `</style>\n`;
    }

    return script + finalView + style;
}

export function transform(tree, lexerErrors = []) {
    const { manifest, reports } = buildManifest(tree, lexerErrors);
    if (!manifest.name) manifest.name = "Component";
    
    if (reports.length > 0) {
        console.error("\n🚫 VIAND COMPILER SCREAMED (" + reports.length + " issues):");
        reports.forEach(err => console.error(`   -> ${err}`));
        throw new Error("Compilation failed.");
    }

    return generateSvelte5(manifest);
}
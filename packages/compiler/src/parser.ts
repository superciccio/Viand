import * as acorn from 'acorn';
import { walk } from 'estree-walker';
import { generate } from 'astring';
import {
    Token,
    ComponentManifest,
    ViewNode,
    ManifestFunction,
    ManifestStyle,
    TestNode
} from './types.ts';

const RUNES = ['state', 'derived', 'props', 'effect', 'inspect', 'host'];

export function cleanLogic(code: string): string {
    if (!code || typeof code !== 'string') return code;
    const preparedCode = code.replace(/\$([a-zA-Z0-9_]+)/g, '__VIAND_VAR_$1');

    try {
        const ast = acorn.parse(preparedCode, { 
            ecmaVersion: 'latest', 
            sourceType: 'module' 
        }) as any;

        walk(ast, {
            enter(node: any) {
                if (node.type === 'Identifier' && node.name.startsWith('__VIAND_VAR_')) {
                    const originalName = node.name.replace('__VIAND_VAR_', '');
                    node.name = RUNES.includes(originalName) ? '$' + originalName : originalName;
                }
            }
        });

        let result = generate(ast).trim();
        if (result.endsWith(';') && !code.trim().endsWith(';')) result = result.slice(0, -1);
        return result;
    } catch (e) {
        return code.replace(/\$([a-zA-Z0-9_]+)/g, (match, p1) => RUNES.includes(p1) ? match : p1);
    }
}

export function cleanViandText(text: string): string {
    if (typeof text !== 'string') return text;
    let cleaned = text.trim();
    cleaned = cleaned.replace(/["']\s*\+\s*/g, '').replace(/\+\s*["']/g, '').replace(/["']/g, '');         
    cleaned = cleaned.replace(/\$([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_.]+)*)/g, '{$1}');
    return cleaned;
}

export function findSplitColon(text: string): number {
    let depth = 0, inQuote = false, quoteChar: string | null = null;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (inQuote) { if (char === quoteChar) inQuote = false; } 
        else {
            if (char === '"' || char === "'") { inQuote = true; quoteChar = char; }
            else if (char === '(' || char === '{' || char === '[') depth++;
            else if (char === ')' || char === '}' || char === ']') depth--;
            else if (char === ':' && depth === 0) return i;
        }
    }
    return -1;
}

export function buildManifest(tree: Token[], lexerErrors: string[], sqlSource: string = ""): { manifest: ComponentManifest, reports: string[] } {
    const manifest: ComponentManifest = {
        name: "Component",
        isMemory: false,
        imports: [], props: [], state: [], reactive: [], functions: [], styles: [], view: [], tests: [], queries: [], slots: []
    };

    if (sqlSource) {
        const lines = sqlSource.split('\n');
        let currentLabel = "";
        let currentQuery = "";
        lines.forEach(line => {
            const labelMatch = line.match(/--\s*label:\s*(\w+)/i);
            if (labelMatch) {
                if (currentLabel && currentQuery) manifest.queries.push({ label: currentLabel, query: currentQuery.trim() });
                currentLabel = labelMatch[1];
                currentQuery = "";
            } else if (currentLabel) {
                currentQuery += line + "\n";
            }
        });
        if (currentLabel && currentQuery) manifest.queries.push({ label: currentLabel, query: currentQuery.trim() });
    }
    
    const stack: any[] = [{ type: 'root', children: manifest.view, depth: -1 }]; 

    for (const token of tree) {
        const trimmed = token.content.trim();
        while (stack.length > 1 && token.depth <= stack[stack.length - 1].depth) stack.pop();
        const context = stack[stack.length - 1];

        if (token.type === 'COMPONENT_DECL') {
            const m = trimmed.match(/component\s+(\w+)/);
            if (m) manifest.name = m[1];
            continue;
        }
        if (token.type === 'MEMORY_DECL') {
            const m = trimmed.match(/memory\s+(\w+)/);
            if (m) {
                manifest.name = m[1];
                manifest.isMemory = true;
            }
            continue;
        }
        if (token.type === 'IMPORT_DECLARATION') {
            if (trimmed === 'use router') {
                manifest.imports.push({ name: 'router', path: 'viand:router' });
                continue;
            }
            const m = trimmed.match(/use\s+(\w+)\s+from\s+["'](.*?)["']/);
            if (m) manifest.imports.push({ name: m[1], path: m[2] });
            continue;
        }
        if (token.type === 'PROP_DECLARATION') {
            const m = trimmed.match(/@prop\s+\"?([a-z_]\w*)/i);
            if (m) {
                const id = m[1];
                let type = 'any', value = 'undefined';
                const tm = trimmed.match(/:\s*([a-z0-9_[\]]+)/i); if (tm) type = tm[1];
                const vm = trimmed.match(/=\s*(.*)$/); if (vm) value = vm[1].trim();
                manifest.props.push({ id, type, value, line: token.line });
            }
            continue;
        }
        if (token.type === 'STATE_VARIABLE') {
            if (context.type === 'function' || context.type === 'js-block' || context.type === 'test-node') {
                const body = context.type === 'test-node' ? context.node.body : context.body;
                body.push(token.content);
            } else {
                const m = trimmed.match(/^\$([a-z_]\w*)/i);
                if (m) {
                    const id = m[1];
                    let type = 'any', value = 'undefined';
                    const tm = trimmed.match(/:\s*([a-z0-9_[\]]+)/i); if (tm) type = tm[1];
                    const vm = trimmed.match(/=\s*(.*)$/); if (vm) value = vm[1].trim();
                    manifest.state.push({ id, type, value, line: token.line });
                }
            }
            continue;
        }
        if (token.type === 'REACTIVE_DECLARATION') {
            const m = trimmed.match(/^sync\s+\$([a-z_]\w*)\s*=\s*(.*)/i);
            if (m) manifest.reactive.push({ id: m[1], expression: m[2] });
            continue;
        }
        if (token.type === 'FUNCTION_ACTION') {
            const m = trimmed.match(/fn\s+(\w+)\s*\((.*?)\)/);
            if (m) {
                const f: ManifestFunction = { type: 'function', name: m[1], params: m[2].split(',').map(p=>p.trim()).filter(p=>p), body: [], depth: token.depth, line: token.line };
                manifest.functions.push(f);
                stack.push(f);
            }
            continue;
        }
        if (token.type === 'STYLE_ROOT') {
            stack.push({ type: 'style', depth: token.depth });
            continue;
        }
        if (token.type === 'TEST_ROOT') {
            stack.push({ type: 'test-suite', depth: token.depth });
            continue;
        }
        if (token.type === 'TEST_PERSONA') {
            const persona = trimmed.slice(1).replace(':', '') as 'logic' | 'ui' | 'integration';
            const node: TestNode = { type: persona, body: [], line: token.line, depth: token.depth };
            manifest.tests.push(node);
            stack.push({ type: 'test-node', node, depth: token.depth });
            continue;
        }

        if (context.type === 'test-node') {
            if (token.type === 'MUST_ASSERTION') {
                context.node.body.push({ type: 'must', expression: trimmed.replace('must ', '').trim(), line: token.line });
            } else {
                context.node.body.push(token.content);
            }
            continue;
        }

        if (context.type === 'style' || context.type === 'style-rule') {
            if (trimmed.endsWith(':')) {
                const rule: ManifestStyle = { selector: trimmed.slice(0, -1), rules: [], line: token.line };
                manifest.styles.push(rule);
                stack.push({ type: 'style-rule', rule, depth: token.depth });
            } else {
                const r = [...stack].reverse().find(s => s.type === 'style-rule');
                if (r) r.rule.rules.push(trimmed);
            }
            continue;
        }

        if (context.type === 'function' || context.type === 'js-block') {
            if (token.type === 'CONTROL_FLOW' && trimmed.startsWith('if ')) {
                const b: ManifestFunction = { type: 'js-block', body: [trimmed], depth: token.depth, line: token.line };
                context.body.push(b);
                stack.push(b);
            } else { context.body.push(token.content); }
            continue;
        }

        if (token.type === 'CONTROL_FLOW') {
            if (trimmed.startsWith('each ')) {
                const m = trimmed.match(/each\s+\$([a-z_]\w*)\s+in\s+\$([a-z_]\w*)/i);
                if (m) {
                    const node: ViewNode = { type: 'each', list: m[2], item: m[1], children: [], line: token.line };
                    context.children.push(node);
                    stack.push({ type: 'view-node', children: node.children, depth: token.depth });
                }
            } else if (trimmed.startsWith('match ')) {
                const node: ViewNode = { type: 'match', expression: trimmed.replace('match ', '').replace(':', '').trim(), children: [], cases: [], line: token.line };
                context.children.push(node);
                stack.push({ type: 'match-root', node, depth: token.depth });
            } else if (trimmed.startsWith('case ') && context.type === 'match-root') {
                const splitIdx = findSplitColon(trimmed);
                let condition = "";
                let inline = "";
                
                if (splitIdx !== -1) {
                    condition = trimmed.slice(0, splitIdx).replace('case ', '').trim();
                    inline = trimmed.slice(splitIdx + 1).trim();
                } else {
                    condition = trimmed.replace('case ', '').replace(':', '').trim();
                }

                const c = { condition, children: [] };
                context.node.cases!.push(c);
                stack.push({ type: 'view-node', children: c.children, depth: token.depth });
                
                if (inline) {
                    c.children.push({ type: 'text', content: inline, children: [], line: token.line });
                }
            } else if (trimmed.startsWith('default') && context.type === 'match-root') {
                const splitIdx = findSplitColon(trimmed);
                let inline = "";
                if (splitIdx !== -1) {
                    inline = trimmed.slice(splitIdx + 1).trim();
                }
                
                const defaultNode = { children: [] };
                context.node.defaultCase = defaultNode;
                stack.push({ type: 'view-node', children: defaultNode.children, depth: token.depth });
                
                if (inline) {
                    defaultNode.children.push({ type: 'text', content: inline, children: [], line: token.line });
                }
            } else if (trimmed.startsWith('if ')) {
                const node: ViewNode = { type: 'if', condition: trimmed.replace('if ', '').replace(':', '').trim(), children: [], line: token.line };
                context.children.push(node);
                stack.push({ type: 'view-node', children: node.children, depth: token.depth, node });
            } else if (trimmed.startsWith('else')) {
                const last = context.children[context.children.length - 1];
                if (last && last.type === 'if') {
                    const node: ViewNode = { type: 'if', condition: trimmed.startsWith('else if ') ? trimmed.replace('else if ', '').replace(':', '').trim() : 'true', children: [], line: token.line };
                    last.alternate = node;
                    stack.push({ type: 'view-node', children: node.children, depth: token.depth });
                }
            }
            continue;
        }

        if (token.type === 'UI_ELEMENT') {
            const idx = findSplitColon(trimmed);
            const tagPart = idx !== -1 ? trimmed.slice(0, idx).trim() : trimmed.trim();
            const inline = idx !== -1 ? trimmed.slice(idx + 1).trim() : "";
            
            if (tagPart.startsWith('slot')) {
                let slotName = "children";
                const sm = tagPart.match(/slot\s+(\w+)/);
                if (sm) slotName = sm[1];
                if (!manifest.slots.includes(slotName)) manifest.slots.push(slotName);
                const node: ViewNode = { type: 'slot', content: slotName, children: [], line: token.line };
                context.children.push(node);
                continue;
            }

            let tagSide = tagPart;
            let eventSide = "";
            if (tagPart.includes('->')) {
                // If it has attributes, the arrow must be AFTER the closing paren
                const lastParen = tagPart.lastIndexOf(')');
                const arrowIdx = tagPart.indexOf('->', lastParen);
                if (arrowIdx !== -1) {
                    tagSide = tagPart.slice(0, arrowIdx).trim();
                    eventSide = tagPart.slice(arrowIdx + 2).trim();
                }
            }
            const sp = tagSide.indexOf('(');
            const ep = tagSide.lastIndexOf(')');
            let tag = tagSide;
            let attrs: Record<string, string> = {};
            if (sp !== -1 && ep !== -1) {
                tag = tagSide.slice(0, sp).trim();
                const attrRaw = tagSide.slice(sp + 1, ep);
                
                // Smart split by comma (respecting nested braces)
                const pairs: string[] = [];
                let start = 0, depth = 0;
                for (let i = 0; i < attrRaw.length; i++) {
                    if (attrRaw[i] === '{' || attrRaw[i] === '(' || attrRaw[i] === '[') depth++;
                    if (attrRaw[i] === '}' || attrRaw[i] === ')' || attrRaw[i] === ']') depth--;
                    if (attrRaw[i] === ',' && depth === 0) {
                        pairs.push(attrRaw.slice(start, i));
                        start = i + 1;
                    }
                }
                pairs.push(attrRaw.slice(start));

                pairs.forEach(pair => {
                    const colonIdx = findSplitColon(pair);
                    if (colonIdx !== -1) {
                        let k = pair.slice(0, colonIdx).trim();
                        let v = pair.slice(colonIdx + 1).trim();
                        
                        // Handle Svelte directives (bind:class, class:active)
                        if (['bind', 'class', 'style'].includes(k)) {
                            const nextColon = findSplitColon(v);
                            if (nextColon !== -1) {
                                k += ':' + v.slice(0, nextColon).trim();
                                v = v.slice(nextColon + 1).trim();
                            }
                        }
                        attrs[k] = v;
                    }
                });
            }
            const tagParts = tag.split('.');
            const actualTag = tagParts[0].trim();
            if (tagParts.length > 1) attrs['class'] = tagParts.slice(1).join(' ').trim();
            if (eventSide) {
                const m = eventSide.match(/^([a-z0-9_.]+)\s*\((.*?)\)$/i);
                if (m) {
                    // Store raw intent, let renderer decide scoping
                    if (!m[2].trim()) attrs['onclick'] = `__VIAND_CALL__${m[1]}()`;
                    else {
                        const handler = m[2].trim();
                        // If handler is a call (ends with ')'), use it as is. Else pass args.
                        const callStr = handler.endsWith(')') ? handler : `${handler}(...args)`;
                        attrs[`on${m[1].replace(/\./g, '|')}`] = `__VIAND_CALL__${callStr}`;
                    }
                } else {
                    attrs['onclick'] = `__VIAND_CALL__${eventSide.replace('()', '').trim()}()`;
                }
            }
            const node: ViewNode = { type: 'element', tag: actualTag, attrs, children: [], line: token.line };
            context.children.push(node);
            if (inline) node.children.push({ type: 'text', content: inline, children: [], line: token.line });
            else if (trimmed.endsWith(':')) stack.push({ type: 'view-node', children: node.children, depth: token.depth });
            continue;
        }

        if (token.type === 'EXPRESSION' && token.depth > 0 && trimmed !== 'view:') {
            context.children.push({ type: 'text', content: trimmed, children: [], line: token.line });
        }
    }
    return { manifest, reports: [] as string[] };
}

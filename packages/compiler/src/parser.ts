import * as acorn from 'acorn';
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
    // Simple fallback logic cleaning
    return code.replace(/\$([a-zA-Z0-9_]+)/g, (match, p1) => RUNES.includes(p1) ? match : p1);
}

export function cleanViandText(text: string): string {
    if (typeof text !== 'string') return text;
    let cleaned = text.trim();
    // Only strip quotes if they are at the start/end of the whole string
    if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        cleaned = cleaned.slice(1, -1);
    }
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

export function buildManifest(tree: Token[], lexerErrors: string[], sqlSource: string = "", apiSource: string = "", langSource: string = ""): { manifest: ComponentManifest, reports: string[] } {
    const manifest: ComponentManifest = {
        name: "Component",
        isMemory: false,
        imports: [], props: [], state: [], reactive: [], functions: [], onMount: [], watch: [], refs: [], styles: [], view: [], tests: [], queries: [], api: [], lang: {}, slots: []
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

    if (apiSource) {
        const lines = apiSource.split('\n');
        let currentApi: any = null;
        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed) return;
            const labelMatch = line.match(/--\s*label:\s*(\w+)/i);
            if (labelMatch) {
                if (currentApi) manifest.api.push(currentApi);
                currentApi = { label: labelMatch[1], method: 'GET', path: '/', headers: {}, query: {}, mock: "" };
                return;
            }
            if (!currentApi) return;
            if (trimmed.startsWith('headers:') || trimmed.startsWith('query:') || trimmed.startsWith('mock:')) {
                currentApi.lastBlock = trimmed.replace(':', '').trim();
                if (currentApi.lastBlock === 'mock') currentApi.mock = "";
                return;
            }
            const indentMatch = line.match(/^(\s+)/);
            if (indentMatch && indentMatch[0].length > 0) {
                if (currentApi.lastBlock === 'mock') {
                    currentApi.mock += trimmed + "\n";
                    return;
                }
                const parts = trimmed.split(':');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const val = parts.slice(1).join(':').trim();
                    if (currentApi.lastBlock === 'headers') currentApi.headers[key] = val;
                    else if (currentApi.lastBlock === 'query') currentApi.query[key] = val;
                }
            } else {
                const httpMatch = trimmed.match(/^(GET|POST|PUT|DELETE|PATCH)\s+(.+)/i);
                if (httpMatch) {
                    currentApi.method = httpMatch[1].toUpperCase();
                    currentApi.path = httpMatch[2].trim();
                    currentApi.lastBlock = null;
                }
            }
        });
        if (currentApi) manifest.api.push(currentApi);
    }

    if (langSource) {
        const lines = langSource.split('\n');
        let currentKey = "";
        lines.forEach(line => {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) return;
            const indentMatch = line.match(/^(\s*)/);
            const indent = indentMatch ? indentMatch[0].length : 0;
            const parts = trimmed.split(':');
            const key = parts[0].trim();
            const val = parts.slice(1).join(':').trim();

            if (indent === 0) {
                currentKey = key;
                manifest.lang[currentKey] = {};
            } else if (currentKey) {
                manifest.lang[currentKey][key] = val.replace(/^["'](.*)["']$/, '$1').trim();
            }
        });
    }
    
    const stack: any[] = [{ type: 'root', children: manifest.view, depth: -1 }]; 

    for (const token of tree) {
        const trimmed = token.content.trim();
        while (stack.length > 1 && token.depth <= stack[stack.length - 1].depth) stack.pop();
        const context = stack[stack.length - 1];

        if (context.body) {
            if (token.type === 'CONTROL_FLOW' && /^if\b/.test(trimmed)) {
                const b: ManifestFunction = { type: 'js-block', body: [trimmed], depth: token.depth, line: token.line };
                context.body.push(b);
                stack.push(b);
                continue;
            } else if (token.type === 'MUST_ASSERTION') {
                context.body.push({ type: 'must', expression: trimmed.replace('must ', '').trim(), line: token.line });
                continue;
            } else { // Treats UI_ELEMENT or EXPRESSION identically as Logic
                context.body.push(token.content);
                continue;
            }
        }

        // 1. Module Declarations
        if (token.type === 'COMPONENT_DECL') {
            const m = trimmed.match(/component\s+(\w+)/);
            if (m) manifest.name = m[1];
            continue;
        }
        if (token.type === 'MEMORY_DECL') {
            const m = trimmed.match(/memory\s+(\w+)/);
            if (m) { manifest.name = m[1]; manifest.isMemory = true; }
            continue;
        }
        if (token.type === 'IMPORT_DECLARATION') {
            if (trimmed === 'use router') {
                manifest.imports.push({ name: 'router', path: 'viand:router' });
                continue;
            }
            if (trimmed === 'use notify') {
                manifest.imports.push({ name: 'notify', path: 'viand:notify' });
                continue;
            }
            if (trimmed === 'use intl') {
                manifest.imports.push({ name: 'intl', path: 'viand:intl' });
                continue;
            }
            const m = trimmed.match(/use\s+(.+?)\s+from\s+["'](.*?)["']/);
            if (m) { manifest.imports.push({ name: m[1].replace(/[{}]/g, '').trim(), path: m[2] }); continue; }
            const m2 = trimmed.match(/use\s+(\w+)/);
            if (m2) manifest.imports.push({ name: m2[1], path: `viand:${m2[1]}` });
            continue;
        }

        // 2. Logic Definitions
        if (token.type === 'PROP_DECLARATION') {
            const m = trimmed.match(/@prop\s+"?([a-z_]\w*)/i);
            if (m) {
                const id = m[1];
                let type = 'any', value = 'undefined';
                const tm = trimmed.match(/:\s*([a-z0-9_[\\]+)/i); if (tm) type = tm[1];
                const vm = trimmed.match(/=\s*(.*)$/); if (vm) value = vm[1].trim();
                manifest.props.push({ id, type, value, line: token.line });
            }
            continue;
        }
        if (token.type === 'STATE_VARIABLE') {
            const m = trimmed.match(/^\$([a-z_]\w*)/i);
            if (m) {
                const id = m[1];
                let type = 'any', value = 'undefined';
                const tm = trimmed.match(/:\s*([a-z0-9_[\\]+)/i); if (tm) type = tm[1];
                const vm = trimmed.match(/=\s*(.*)$/); if (vm) value = vm[1].trim();
                manifest.state.push({ id, type, value, line: token.line });
                continue;
            }
        }
        if (token.type === 'REACTIVE_DECLARATION') {
            const m = trimmed.match(/^sync\s+\$([a-z_]\w*)\s*=\s*(.*)/i);
            if (m) manifest.reactive.push({ id: m[1], expression: m[2] });
            continue;
        }

        // 3. Logic Block Entries
        if (token.type === 'FUNCTION_ACTION') {
            const m = trimmed.match(/fn\s+(\w+)\s*\((.*?)\)/);
            if (m) {
                const f: ManifestFunction = { type: 'function', name: m[1], params: m[2].split(',').map(p=>p.trim()).filter(p=>p), body: [], depth: token.depth, line: token.line };
                manifest.functions.push(f);
                stack.push(f);
            }
            continue;
        }
        if (token.type === 'LIFECYCLE_BLOCK') {
            const block = { type: 'lifecycle', body: manifest.onMount, depth: token.depth };
            stack.push(block);
            continue;
        }
        if (token.type === 'WATCH_BLOCK') {
            const dependency = trimmed.replace('on change ', '').replace(':', '').trim();
            const w = { dependency, body: [] };
            manifest.watch.push(w);
            stack.push({ type: 'watch', body: w.body, depth: token.depth });
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
            stack.push({ type: 'test-node', body: node.body, depth: token.depth });
            continue;
        }

        // 4. View Context Start
        if (token.type === 'VIEW_ROOT') {
            stack.push({ type: 'view-root', children: manifest.view, depth: token.depth });
            continue;
        }

        // 🎨 VIEW HANDLING
        if (token.type === 'STYLE_ROOT') {
            stack.push({ type: 'style', depth: token.depth });
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

        if (token.type === 'CONTROL_FLOW' && (context.children || context.type === 'match-root')) {
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
                let condition = "", inline = "";
                if (splitIdx !== -1) {
                    condition = trimmed.slice(0, splitIdx).replace('case ', '').trim();
                    inline = trimmed.slice(splitIdx + 1).trim();
                } else {
                    condition = trimmed.replace('case ', '').replace(':', '').trim();
                }
                const c = { condition, children: [] };
                context.node.cases!.push(c);
                stack.push({ type: 'view-node', children: c.children, depth: token.depth });
                if (inline) c.children.push({ type: 'text', content: inline, children: [], line: token.line });
            } else if (trimmed.startsWith('default') && context.type === 'match-root') {
                const splitIdx = findSplitColon(trimmed);
                let inline = "";
                if (splitIdx !== -1) inline = trimmed.slice(splitIdx + 1).trim();
                const defaultNode = { children: [] };
                context.node.defaultCase = defaultNode;
                stack.push({ type: 'view-node', children: defaultNode.children, depth: token.depth });
                if (inline) defaultNode.children.push({ type: 'text', content: inline, children: [], line: token.line });
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

        if (token.type === 'UI_ELEMENT' && context.children) {
            const idx = findSplitColon(trimmed);
            let declaration = "";
            let inline = "";
            
            if (idx !== -1) {
                // Heuristic: If the colon is part of an attribute (inside parens), it's not the split colon.
                // findSplitColon already handles depth, so we trust it.
                declaration = trimmed.slice(0, idx).trim();
                inline = trimmed.slice(idx + 1).trim();
            } else {
                declaration = trimmed.replace(/:$/, '').trim();
            }
            if (declaration.startsWith('slot')) {
                let slotName = "children";
                const sm = declaration.match(/slot\s+(\w+)/);
                if (sm) slotName = sm[1];
                if (!manifest.slots.includes(slotName)) manifest.slots.push(slotName);
                const node: ViewNode = { type: 'slot', content: slotName, children: [], line: token.line };
                context.children.push(node);
                continue;
            }
            let tagSide = declaration;
            let eventSide = "";
            if (declaration.includes('->')) {
                const parts = declaration.split('->');
                eventSide = parts.pop()!.trim();
                tagSide = parts.join('->').trim();
            }
            const sp = tagSide.indexOf('(');
            const ep = tagSide.lastIndexOf(')');
            let tag = tagSide;
            let attrs: Record<string, string> = {};
            if (sp !== -1 && ep !== -1) {
                tag = tagSide.slice(0, sp).trim();
                const attrRaw = tagSide.slice(sp + 1, ep);
                const pairs: string[] = [];
                let start = 0, d = 0;
                for (let i = 0; i < attrRaw.length; i++) {
                    if (attrRaw[i] === '{' || attrRaw[i] === '(' || attrRaw[i] === '[') d++;
                    if (attrRaw[i] === '}' || attrRaw[i] === ')' || attrRaw[i] === ']') d--;
                    if (attrRaw[i] === ',' && d === 0) {
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
            let actualTag = tagParts[0].trim();
            let refName = "";
            if (actualTag.includes('#')) {
                const parts = actualTag.split('#');
                actualTag = parts[0].trim();
                refName = parts[1].trim();
                if (!manifest.refs.includes(refName)) manifest.refs.push(refName);
            }
            if (tagParts.length > 1) attrs['class'] = tagParts.slice(1).join(' ').trim();
            if (eventSide) {
                const m = eventSide.match(/^([a-z0-9_.]+)\s*\((.*?)\)$/i);
                if (m) {
                    if (!m[2].trim()) attrs['onclick'] = `__VIAND_CALL__${m[1]}()`;
                    else {
                        const h = m[2].trim();
                        const callStr = h.endsWith(')') ? h : `${h}(...args)`;
                        attrs[`on${m[1].replace(/\./g, '|')}`] = `__VIAND_CALL__${callStr}`;
                    }
                } else {
                    attrs['onclick'] = `__VIAND_CALL__${eventSide.replace('()', '').trim()}()`;
                }
            }
            const node: ViewNode = { type: 'element', tag: actualTag, attrs, ref: refName, children: [], line: token.line };
            context.children.push(node);
            if (inline) node.children.push({ type: 'text', content: inline, children: [], line: token.line });
            else if (trimmed.endsWith(':')) stack.push({ type: 'view-node', children: node.children, depth: token.depth });
            continue;
        }

        if (token.type === 'EXPRESSION' && token.depth > 0 && context.children) {
            context.children.push({ type: 'text', content: trimmed, children: [], line: token.line });
        }
    }
    return { manifest, reports: [] as string[] };
}
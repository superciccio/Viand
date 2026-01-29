import * as acorn from 'acorn';
import { walk } from 'estree-walker';
import { generate } from 'astring';
import { 
    Token, 
    ComponentManifest, 
    ViewNode, 
    ManifestFunction, 
    ManifestStyle
} from './types';

/**
 * 1. LOGIC PROCESSING (Acorn)
 */
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

function cleanViandText(text: string): string {
    if (typeof text !== 'string') return text;
    return text.trim()
        .replace(/["']\s*\+\s*/g, '').replace(/\+\s*["']/g, '').replace(/["']/g, '')
        .replace(/\$([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_.]+)*)/g, '{$1}');
}

function findSplitColon(text: string): number {
    let depth = 0, inQuote = false, quoteChar: string | null = null;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (inQuote) { if (char === quoteChar) inQuote = false; }
        else if (char === '"' || char === "'") { inQuote = true; quoteChar = char; }
        else if (char === '(') depth++;
        else if (char === ')') depth--;
        else if (char === ':' && depth === 0) return i;
    }
    return -1;
}

/**
 * 2. MANIFEST BUILDER
 */
export function buildManifest(tree: Token[], lexerErrors: string[]) {
    const manifest: ComponentManifest = {
        name: "Component",
        imports: [], props: [], state: [], reactive: [], functions: [], styles: [], view: []
    };
    
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
        if (token.type === 'IMPORT_DECLARATION') {
            const m = trimmed.match(/use\s+(\w+)\s+from\s+["'](.*?)["']/);
            if (m) manifest.imports.push({ name: m[1], path: m[2] });
            continue;
        }
        if (token.type === 'PROP_DECLARATION') {
            const m = trimmed.match(/@prop\s+\$?([a-z_]\w*)/i);
            if (m) {
                const id = m[1];
                let type = 'any', value = 'undefined';
                const tm = trimmed.match(/:\s*([a-z0-9_[\]]+)/i); if (tm) type = tm[1];
                const vm = trimmed.match(/=\s*(.*)$/); if (vm) value = vm[1].trim();
                manifest.props.push({ id, type, value });
            }
            continue;
        }
        if (token.type === 'STATE_VARIABLE') {
            if (context.type === 'function' || context.type === 'js-block') {
                context.body.push(token.content);
            } else {
                const m = trimmed.match(/^\$([a-z_]\w*)/i);
                if (m) {
                    const id = m[1];
                    let type = 'any', value = 'undefined';
                    const tm = trimmed.match(/:\s*([a-z0-9_[\]]+)/i); if (tm) type = tm[1];
                    const vm = trimmed.match(/=\s*(.*)$/); if (vm) value = vm[1].trim();
                    manifest.state.push({ id, type, value });
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
                const f: ManifestFunction = { type: 'function', name: m[1], params: m[2].split(',').map(p=>p.trim()).filter(p=>p), body: [], depth: token.depth };
                manifest.functions.push(f);
                stack.push(f);
            }
            continue;
        }
        if (token.type === 'STYLE_ROOT') {
            stack.push({ type: 'style', depth: token.depth });
            continue;
        }

        if (context.type === 'style' || context.type === 'style-rule') {
            if (trimmed.endsWith(':')) {
                const rule = { selector: trimmed.slice(0, -1), rules: [] };
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
                const b: ManifestFunction = { type: 'js-block', body: [trimmed], depth: token.depth };
                context.body.push(b);
                stack.push(b);
            } else { context.body.push(token.content); }
            continue;
        }

        if (token.type === 'CONTROL_FLOW') {
            if (trimmed.startsWith('each ')) {
                const m = trimmed.match(/each\s+\$([a-z_]\w*)\s+in\s+\$([a-z_]\w*)/i);
                if (m) {
                    const node: ViewNode = { type: 'each', list: m[2], item: m[1], children: [] };
                    context.children.push(node);
                    stack.push({ type: 'view-node', children: node.children, depth: token.depth });
                }
            } else if (trimmed.startsWith('match ')) {
                const node: ViewNode = { type: 'match', expression: trimmed.replace('match ', '').replace(':', '').trim(), children: [], cases: [] };
                context.children.push(node);
                stack.push({ type: 'match-root', node, depth: token.depth });
            } else if (trimmed.startsWith('case ') && context.type === 'match-root') {
                const c = { condition: trimmed.replace('case ', '').replace(':', '').trim(), children: [] };
                context.node.cases!.push(c);
                stack.push({ type: 'view-node', children: c.children, depth: token.depth });
            } else if (trimmed.startsWith('default') && context.type === 'match-root') {
                const d = { children: [] };
                context.node.defaultCase = d;
                stack.push({ type: 'view-node', children: d.children, depth: token.depth });
            } else if (trimmed.startsWith('if ')) {
                const node: ViewNode = { type: 'if', condition: trimmed.replace('if ', '').replace(':', '').trim(), children: [] };
                context.children.push(node);
                stack.push({ type: 'view-node', children: node.children, depth: token.depth, node });
            } else if (trimmed.startsWith('else')) {
                const last = context.children[context.children.length - 1];
                if (last && last.type === 'if') {
                    const node: ViewNode = { type: 'if', condition: trimmed.startsWith('else if ') ? trimmed.replace('else if ', '').replace(':', '').trim() : 'true', children: [] };
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
            let tagSide = tagPart;
            let eventSide = "";
            if (tagPart.includes('->')) {
                const p = tagPart.split('->');
                tagSide = p[0].trim();
                eventSide = p[1].trim();
            }
            const sp = tagSide.indexOf('(');
            const ep = tagSide.lastIndexOf(')');
            let tag = tagSide;
            let attrs: Record<string, string> = {};
            if (sp !== -1 && ep !== -1) {
                tag = tagSide.slice(0, sp).trim();
                tagSide.slice(sp + 1, ep).split(',').forEach(pair => {
                    const pp = pair.split(':');
                    if (pp.length >= 2) {
                        let k = pp[0].trim();
                        let vParts = pp.slice(1);
                        if (['bind', 'class', 'style'].includes(k)) k += ':' + vParts.shift()!.trim();
                        attrs[k] = vParts.join(':').trim();
                    }
                });
            }
            const tagParts = tag.split('.');
            const actualTag = tagParts[0].trim();
            if (tagParts.length > 1) attrs['class'] = tagParts.slice(1).join(' ').trim();
            if (eventSide) {
                const m = eventSide.match(/^([a-z0-9_.]+)\s*\((.*?)\)$/i);
                if (m) {
                    if (!m[2].trim()) attrs['on:click'] = m[1];
                    else attrs[`on:${m[1].replace(/\./g, '|')}`] = m[2];
                } else attrs['on:click'] = eventSide.replace('()', '').trim();
            }
            const node: ViewNode = { type: 'element', tag: actualTag, attrs, children: [] };
            context.children.push(node);
            if (inline) node.children.push({ type: 'text', content: inline, children: [] });
            else if (trimmed.endsWith(':')) stack.push({ type: 'view-node', children: node.children, depth: token.depth });
            continue;
        }

        if (token.type === 'EXPRESSION' && token.depth > 0 && trimmed !== 'view:') {
            context.children.push({ type: 'text', content: trimmed, children: [] });
        }
    }
    return { manifest, reports: [] as string[] };
}

/**
 * 3. GENERATOR
 */
export function generateSvelte5(manifest: ComponentManifest): string {
    let script = `<script lang="ts">
`;
    manifest.imports.forEach(i => script += `  import ${i.name} from "${i.path}";
`);
    if (manifest.props.length > 0) script += `  let { ${manifest.props.map(p => `${p.id} = $bindable(${p.value})`).join(', ')} } = $props();
`;
    manifest.state.forEach(s => script += `  let ${s.id}: ${s.type === 'array' ? 'any[]' : s.type} = $state(${s.value});
`);
    manifest.reactive.forEach(r => script += `  let ${r.id} = $derived(${cleanLogic(r.expression)});
`);
    manifest.functions.forEach(f => {
        script += `
  function ${f.name}(${f.params?.join(', ')}) {
`;
        const renderBody = (body: (string | ManifestFunction)[], indent: string): string => body.map(line => {
            if (typeof line === 'string') return `${indent}${cleanLogic(line)};\n`;
            const rawHeader = line.body[0].toString().trim();
            const jsHeader = rawHeader.replace(/^if\s+(.*):$/, 'if ($1) {');
            const h = cleanLogic(jsHeader);
            return `${indent}${h}\n${renderBody(line.body.slice(1), indent + "  ")}${indent}}
`;
        }).join('');
        script += renderBody(f.body, "    ") + `  }
`;
    });
    script += `</script>

`;

    const renderNode = (node: ViewNode, indent: string): string => {
        if (node.type === 'text') return `${indent}${cleanViandText(node.content!)}\n`;
        if (node.type === 'element') {
            const attrParts = Object.entries(node.attrs || {}).map(([k, v]) => {
                let val;
                let attrName = k;
                
                // Svelte 5: on:click -> onclick
                if (k.startsWith('on:')) {
                    attrName = k.replace('on:', 'on');
                    val = `{${v}}`;
                } else if (v.startsWith('$')) {
                    val = `{${v.slice(1)}}`;
                } else if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
                    val = v;
                } else {
                    val = `"${v}"`;
                }
                return `${attrName}=${val}`;
            });
            const attrStr = attrParts.length ? ' ' + attrParts.join(' ') : '';
            if (['input','img','br','hr'].includes(node.tag!.toLowerCase())) return `${indent}<${node.tag}${attrStr} />\n`;
            return `${indent}<${node.tag}${attrStr}>
${node.children.map(c => renderNode(c, indent + "  ")).join('')}${indent}</${node.tag}>
`;
        }
        if (node.type === 'each') return `${indent}{#each ${cleanLogic(node.list!)} as ${cleanLogic(node.item!)}}
${node.children.map(c => renderNode(c, indent + "  ")).join('')}${indent}{/each}\n`;
        if (node.type === 'if') {
            let out = `${indent}{#if ${cleanLogic(node.condition!)}}
${node.children.map(c => renderNode(c, indent + "  ")).join('')}`;
            if (node.alternate) {
                if (node.alternate.condition === 'true') out += `${indent}{:else}\n${node.alternate.children.map(c => renderNode(c, indent + "  ")).join('')}`; 
                else out += `${indent}{:else if ${cleanLogic(node.alternate.condition!)}}
${node.alternate.children.map(c => renderNode(c, indent + "  ")).join('')}`;
            }
            return out + `${indent}{/if}\n`;
        }
        if (node.type === 'match') {
            const e = cleanLogic(node.expression!);
            let out = "";
            node.cases!.forEach((c, i) => {
                const header = i === 0 ? `{#if ${e} === ${c.condition}}` : `{:else if ${e} === ${c.condition}}`;
                out += `${indent}${header}\n${c.children.map(child => renderNode(child, indent + "  ")).join('')}`;
            });
            if (node.defaultCase) out += `${indent}{:else}\n${node.defaultCase.children.map(child => renderNode(child, indent + "  ")).join('')}`;
            return out + `${indent}{/if}\n`;
        }
        return "";
    };
    const finalView = manifest.view.map(n => renderNode(n, "")).join('');
    let style = "";
    if (manifest.styles.length > 0) {
        style = `\n<style>\n`;
        manifest.styles.forEach(s => {
            style += `  ${s.selector} {\n`;
            s.rules.forEach(r => style += `    ${r};\n`);
            style += `  }\n`;
        });
        style += `</style>\n`;
    }
    return script + finalView + style;
}

export function transform(tree: Token[], lexerErrors: string[] = []) {
    const { manifest, reports } = buildManifest(tree, lexerErrors);
    if (reports.length > 0) throw new Error("Compilation failed.");
    return generateSvelte5(manifest);
}
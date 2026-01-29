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
    let cleaned = text.trim();
    cleaned = cleaned.replace(/["']\s*\+\s*/g, '').replace(/\+\s*["']/g, '').replace(/["']/g, '');
    cleaned = cleaned.replace(/\$([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_.]+)*)/g, '{$1}');
    return cleaned;
}

function findSplitColon(text: string): number {
    let depth = 0, inQuote = false, quoteChar: string | null = null;
    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        if (inQuote) { if (char === quoteChar) inQuote = false; } 
        else {
            if (char === '"' || char === "'") { inQuote = true; quoteChar = char; }
            else if (char === '(') depth++;
            else if (char === ')') depth--;
            else if (char === ':' && depth === 0) return i;
        }
    }
    return -1;
}

/**
 * 2. MANIFEST BUILDER
 */
export function buildManifest(tree: Token[], lexerErrors: string[], sqlSource: string = "") {
    const manifest: ComponentManifest = {
        name: "Component",
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
        if (token.type === 'IMPORT_DECLARATION') {
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
            const persona = trimmed.slice(1) as 'logic' | 'ui' | 'integration';
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
                const c = { condition: trimmed.replace('case ', '').replace(':', '').trim(), children: [] };
                context.node.cases!.push(c);
                stack.push({ type: 'view-node', children: c.children, depth: token.depth });
            } else if (trimmed.startsWith('default') && context.type === 'match-root') {
                const defaultNode = { children: [] };
                context.node.defaultCase = defaultNode;
                stack.push({ type: 'view-node', children: defaultNode.children, depth: token.depth });
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
            
            // Handle 'slot' keyword
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
                    if (!m[2].trim()) attrs['onclick'] = `{() => $.${m[1]}()}`;
                    else attrs[`on${m[1].replace(/\./g, '|')}`] = `{(...args) => $.${m[2]}(...args)}`;
                } else {
                    attrs['onclick'] = `{() => $.${eventSide.replace('()', '').trim()}()}`;
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

/**
 * 3. LOGIC GENERATOR (Shared Brain)
 */
export function generateLogicClass(manifest: ComponentManifest): string {
    let code = `export class ${manifest.name}Logic {
`;
    manifest.state.forEach(s => code += `  ${s.id} = $state(${s.value});\n`);
    manifest.props.forEach(p => code += `  ${p.id} = $state(${p.value});\n`);
    manifest.reactive.forEach(r => {
        const expr = r.expression.replace(/\$([a-zA-Z0-9_]+)/g, 'this.$1');
        code += `  ${r.id} = $derived(${expr});\n`;
    });

    manifest.functions.forEach(f => {
        code += `
  ${f.name}(${f.params?.join(', ')}) {
`;
        const renderBody = (body: (string | ManifestFunction)[], indent: string): string => {
            return body.map(line => {
                if (typeof line === 'string') {
                    const trimmedLine = line.trim();
                    if (!trimmedLine || trimmedLine.startsWith('#') || trimmedLine.startsWith('//')) return "";
                    let cleaned = line.replace(/\$([a-zA-Z0-9_]+)/g, 'this.$1');
                    cleaned = cleaned.replace(/\bsql\./g, 'this.sql.');
                    return `${indent}${cleaned};\n`;
                } else if (line.type === 'js-block') {
                    const rawH = line.body[0].toString().trim();
                    let h = rawH.replace(/^if\s+(.*):$/, 'if ($1) {');
                    h = h.replace(/\$([a-zA-Z0-9_]+)/g, 'this.$1');
                    return `${indent}${h}\n${renderBody(line.body.slice(1), indent + "  ")}${indent}}\n`;
                }
                return "";
            }).join('');
        };
        code += renderBody(f.body, "    ");
        code += `  }
`;
    });

    if (manifest.queries.length > 0) {
        code += `
  sql = {
`;
        manifest.queries.forEach(q => {
            code += `    ${q.label}: (...args: any[]) => {
`;
            code += `      console.log("SQL EXEC [${q.label}]: ${q.query.replace(/\n/g, ' ')}", args);
`;
            code += `      return [];
`;
            code += `    },
`;
        });
        code += `  }
`;
    }
    
    return code + `}
`;
}

/**
 * 4. SVELTE GENERATOR (Wrapper)
 */
export function generateSvelte5(manifest: ComponentManifest): string {
    let script = `<script lang="ts">
`;
    manifest.imports.forEach(i => script += `  import ${i.name} from "${i.path}";\n`);
    script += `  import { ${manifest.name}Logic } from "./${manifest.name}.viand.logic.svelte";
`;
    
    const propNames = manifest.props.map(p => p.id);
    if (manifest.slots.length > 0) {
        manifest.slots.forEach(s => { if (!propNames.includes(s)) propNames.push(s); });
    }
    
    if (propNames.length > 0) {
        script += `  let { ${propNames.map(id => {
            const p = manifest.props.find(x => x.id === id);
            return p ? `${id} = $bindable(${p.value})` : id;
        }).join(', ')} } = $props();\n`;
    }
    
    script += `  const $ = new ${manifest.name}Logic();
`;
    manifest.props.forEach(p => script += `  $effect(() => { $.${p.id} = ${p.id}; });\n`);
    script += `</script>\n\n`;

    const renderNode = (node: ViewNode, indent: string, localVars: string[] = []): string => {
        if (node.type === 'text') {
            let content = cleanViandText(node.content!);
            content = content.replace(/\{([a-zA-Z0-9_.]+)\}/g, (match, p1) => {
                const rootVar = p1.split('.')[0];
                return localVars.includes(rootVar) ? `{${p1}}` : `{$.${p1}}`;
            });
            return `${indent}${content}\n`;
        }
        if (node.type === 'slot') {
            return `${indent}{@render ${node.content}()}\n`;
        }
        if (node.type === 'element') {
            const attrParts = Object.entries(node.attrs || {}).map(([k, v]) => {
                let val = v;
                if (v.startsWith('$')) {
                    const varPath = v.slice(1);
                    const rootVar = varPath.split('.')[0];
                    val = localVars.includes(rootVar) ? `{${varPath}}` : `{$.${rootVar}}`;
                }
                else if (k.startsWith('bind:')) {
                    const rootVar = v.split('.')[0];
                    val = localVars.includes(rootVar) ? `{${v}}` : `{$.${v}}`;
                }
                else if (!v.startsWith('{') && !v.startsWith('"') && !v.startsWith("'")) {
                    val = `"${v}"`;
                }
                return `${k}=${val}`;
            });
            const attrStr = attrParts.length > 0 ? ' ' + attrParts.join(' ') : '';
            const tag = node.tag ? node.tag.toLowerCase() : 'div';
            const isComponent = node.tag && node.tag[0] === node.tag[0].toUpperCase();
            
            if (['input','img','br','hr'].includes(tag)) return `${indent}<${node.tag}${attrStr} />\n`;
            
            let childrenStr = "";
            if (node.children.length > 0) {
                if (isComponent) {
                    childrenStr += `${indent}  {#snippet children()}
`;
                    childrenStr += node.children.map(c => renderNode(c, indent + "    ", localVars)).join('');
                    childrenStr += `${indent}  {/snippet}\n`;
                } else {
                    childrenStr += node.children.map(c => renderNode(c, indent + "  ", localVars)).join('');
                }
            }
            
            return `${indent}<${node.tag}${attrStr}>
${childrenStr}${indent}</${node.tag}>
`;
        }
        if (node.type === 'each') {
            const newLocalVars = [...localVars, node.item!];
            return `${indent}{#each $.${node.list} as ${node.item}}\n${node.children.map(c => renderNode(c, indent + "  ", newLocalVars)).join('')}${indent}{/each}\n`;
        }
        if (node.type === 'if') {
            let out = `${indent}{#if ${cleanLogic(node.condition!)}}
${node.children.map(c => renderNode(c, indent + "  ", localVars)).join('')}`;
            if (node.alternate) {
                if (node.alternate.condition === 'true') out += `${indent}{:else}\n${node.alternate.children.map(c => renderNode(c, indent + "  ", localVars)).join('')}`; 
                else out += `${indent}{:else if ${cleanLogic(node.alternate.condition!)}}
${node.alternate.children.map(c => renderNode(c, indent + "  ", localVars)).join('')}`;
            }
            return out + `${indent}{/if}\n`;
        }
        if (node.type === 'match') {
            const rawExpr = node.expression!.startsWith('$') ? node.expression!.slice(1) : node.expression!;
            const rootVar = rawExpr.split('.')[0];
            const e = localVars.includes(rootVar) ? rawExpr : `$.${rawExpr}`;
            let out = "";
            node.cases!.forEach((c, i) => {
                const header = i === 0 ? `{#if ${e} === ${c.condition}}` : `{:else if ${e} === ${c.condition}}`;
                out += `${indent}${header}\n${c.children.map(child => renderNode(child, indent + "  ", localVars)).join('')}`;
            });
            if (node.defaultCase) out += `${indent}{:else}\n${node.defaultCase.children.map(child => renderNode(child, indent + "  ", localVars)).join('')}`;
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

/**
 * 5. TEST GENERATOR
 */
export function generateTests(manifest: ComponentManifest): string {
    if (manifest.tests.length === 0) return "";
    let code = `import { describe, it, expect } from 'vitest';\n`;
    code += `import { ${manifest.name}Logic } from './${manifest.name}.viand.logic.svelte';\n\n`;

    manifest.tests.forEach(suite => {
        code += `describe('${manifest.name} ${suite.type}', () => {\n`;
        code += `  it('should pass ${suite.type} verification', () => {\n`;
        code += `    const $ = new ${manifest.name}Logic();\n`;
        suite.body.forEach(line => {
            if (typeof line === 'object' && line.type === 'must') {
                let expr = line.expression.replace(/\$([a-zA-Z0-9_]+)/g, '$.$1');
                code += `    expect(${expr}).toBeTruthy();\n`;
            } else if (typeof line === 'string') {
                const trimmedLine = line.trim();
                if (!trimmedLine || trimmedLine.startsWith('#') || trimmedLine.startsWith('//')) return;
                let cleaned = line.replace(/\$([a-zA-Z0-9_]+)/g, '$.$1');
                manifest.functions.forEach(f => {
                    const regex = new RegExp(`\b${f.name}\(`, 'g');
                    if (!cleaned.includes(`$.${f.name}(`)) cleaned = cleaned.replace(regex, `$.${f.name}(`);
                });
                code += `    ${cleaned};\n`;
            }
        });
        code += `  });\n`;
        code += `});\n`;
    });
    return code;
}

export function transform(tree: Token[], lexerErrors: string[] = [], sql: string = "") {
    const { manifest, reports } = buildManifest(tree, lexerErrors, sql);
    if (reports.length > 0) throw new Error("Compilation failed.");
    return generateSvelte5(manifest);
}

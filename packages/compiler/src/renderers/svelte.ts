import { ComponentManifest, ViewNode } from '../types.ts';
import { cleanViandText } from '../parser.ts';
import { generateLogicClass } from './logic.ts';

/**
 * ⚛️ Atomic Svelte 5 Renderer
 * Assembles the Brain (Logic) and Face (View) into a single Svelte component.
 */
export function generateSvelte5(manifest: ComponentManifest): string {
    if (manifest.isMemory) {
        // Global state still needs its own file structure or a specific export pattern
        return generateLogicClass(manifest) + `\nexport const ${manifest.name} = create${manifest.name}Logic({});\n`;
    }

    let script = `<script lang="ts">
`;
    script += `  import { onMount } from "svelte";
`;
    
    // 1. Standard Imports (Top Level)
    manifest.imports.forEach(i => {
        if (i.path === 'viand:router') {
            script += `  import { router } from "./viand-router.svelte.ts";
`;
        } else if (i.path === 'viand:notify') {
            script += `  import { notify } from "./viand-notify.ts";
`;
        } else if (i.path === 'viand:intl') {
            script += `  import { intl } from "./viand-intl.svelte.ts";
`;
        } else if (i.path.endsWith('.viand')) {
            script += `  import ${i.name} from "${i.path}";
`;
        } else {
            script += `  import { ${i.name} } from "${i.path}";
`;
        }
    });

    // 2. EMBEDDED LOGIC (The Brain)
    script += `\n  // --- Viand Brain ---
`;
    script += generateLogicClass(manifest);
    
    // 3. COMPONENT BRIDGE
    script += `\n  // --- Component Face Bridge ---\n`;
    script += `  let __props = $props();\n`;

    const propNames = manifest.props.map(p => p.id);
    manifest.slots.forEach(s => { if (!propNames.includes(s)) propNames.push(s); });
    
    if (propNames.length > 0) {
        script += `  let { ${propNames.map(id => {
            const p = manifest.props.find(x => x.id === id);
            return p ? `${id} = $bindable(${p.value})` : id;
        }).join(', ')} } = __props;\n`;
    }

    // Initialize Logic Factory with the shared props object
    script += `  const _ = create${manifest.name}Logic(__props);\n`;
    
    if (manifest.onMount.length > 0) script += `  onMount(() => _.onMount());
`;
    script += `</script>

`;

    const renderNode = (node: ViewNode, indent: string): string => {
        if (node.type === 'text') {
            let content = node.content.trim();
            if (!content) return "";
            content = cleanViandText(content);
            const importedNames = manifest.imports.map(i => i.name);
            const localVars = [...manifest.props.map(p => p.id), ...manifest.state.map(s => s.id), ...manifest.reactive.map(r => r.id), 'router', 'intl', 'notify'];
            content = content.replace(/\{([a-zA-Z0-9_.]+)\}/g, (match, p1) => {
                const rootVar = p1.split('.')[0];
                if (localVars.includes(rootVar) || importedNames.includes(rootVar)) return `{${p1}}`;
                return `{_.${p1}}`;
            });
            return `${indent}${content}\n`;
        }

        if (node.type === 'element') {
            const tag = node.tag;
            if (tag.startsWith('#snippet')) {
                const snippetName = tag.replace('#snippet', '').trim();
                let children = node.children.map(c => renderNode(c, indent + "  ")).join('');
                return `${indent}{#snippet ${snippetName}}\n${children}${indent}{/snippet}\n`;
            }

            let attrStr = "";
            Object.entries(node.attrs).forEach(([k, v]) => {
                if (k.startsWith('on')) {
                    const event = k.slice(2);
                    const handler = v.replace('__VIAND_CALL__', '_.');
                    attrStr += ` on${event}={${handler}}`;
                } else if (k.startsWith('bind:')) {
                    const target = v.replace(/\$([a-z0-9_]+)/gi, '_. $1').replace(/\bintl\./g, 'intl.').replace(/\brouter\./g, 'router.');
                    attrStr += ` ${k}={${target}}`;
                } else if (k.startsWith('class:')) {
                    const condition = v.replace(/\$([a-z0-9_]+)/gi, '_. $1').replace(/\bintl\./g, 'intl.').replace(/\brouter\./g, 'router.');
                    attrStr += ` ${k}={${condition}}`;
                } else if (k === 'class') {
                    attrStr += ` class="${v}"`;
                } else {
                    const val = v.replace(/\$([a-z0-9_]+)/gi, '_. $1').replace(/\bintl\./g, 'intl.').replace(/\brouter\./g, 'router.');
                    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'" ) && val.endsWith("'" ))) {
                        attrStr += ` ${k}=${val}`;
                    } else {
                        attrStr += ` ${k}={${val}}`;
                    }
                }
            });

            if (node.ref) attrStr += ` bind:this={_.${node.ref}}`;

            if (node.children.length === 0) return `${indent}<${tag}${attrStr} />\n`;
            let children = node.children.map(c => renderNode(c, indent + "  ")).join('');
            return `${indent}<${tag}${attrStr}>
${children}${indent}</${tag}>
`;
        }

        if (node.type === 'each') {
            return `${indent}{#each _.${node.list} as ${node.item}}\n${node.children.map(c => renderNode(c, indent + "  ")).join('')}${indent}{/each}\n`;
        }

        if (node.type === 'if') {
            let res = `${indent}{#if ${node.condition.replace(/\$([a-z0-9_]+)/gi, '_. $1')}}\n${node.children.map(c => renderNode(c, indent + "  ")).join('')}`;
            if (node.alternate) {
                if (node.alternate.condition === 'true') {
                    res += `${indent}{:else}\n${node.alternate.children.map(c => renderNode(c, indent + "  ")).join('')}`;
                } else {
                    res += `${indent}{:else if ${node.alternate.condition.replace(/\$([a-z0-9_]+)/gi, '_. $1')}}\n${node.alternate.children.map(c => renderNode(c, indent + "  ")).join('')}`;
                }
            }
            res += `${indent}{/if}\n`;
            return res;
        }

        if (node.type === 'match') {
            let res = `${indent}{#match ${node.expression.replace(/\$([a-z0-9_]+)/gi, '_. $1')}}\n`;
            node.cases?.forEach(c => {
                res += `${indent}  {#case ${c.condition}}\n${c.children.map(child => renderNode(child, indent + "    ")).join('')}`;
            });
            if (node.defaultCase) {
                res += `${indent}  {:default}\n${node.defaultCase.children.map(child => renderNode(child, indent + "    ")).join('')}`;
            }
            res += `${indent}{/match}\n`;
            return res;
        }

        if (node.type === 'slot') return `${indent}{@render ${node.content}()}\n`;
        return "";
    };

    let view = manifest.view.map(n => renderNode(nodeToSnippet(n), "")).join('');
    let css = "";
    if (manifest.styles.length > 0) {
        css = `\n<style>\n${manifest.styles.map(s => `  ${s.selector} {\n${s.rules.map(r => `    ${r};`).join('\n')}\n  }`).join('\n')}\n</style>`;
    }

    return script + view + css;
}

function nodeToSnippet(node: ViewNode): ViewNode {
    if (node.type === 'element' && /^[A-Z]/.test(node.tag)) {
        const children = node.children;
        if (children.length > 0) {
            node.children = [{ type: 'element', tag: '#snippet children()', attrs: {}, children: children, line: 0 }];
        }
    }
    return node;
}

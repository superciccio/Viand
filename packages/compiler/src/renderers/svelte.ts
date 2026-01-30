import { ComponentManifest, ViewNode } from '../types.ts';
import { cleanLogic, cleanViandText } from '../parser.ts';

export function generateSvelte5(manifest: ComponentManifest): string {
    if (manifest.isMemory) return "";
    let script = `<script lang="ts">
`;
    if (manifest.onMount.length > 0) script += `  import { onMount } from "svelte";
`;
    
    manifest.imports.forEach(i => {
        let path = i.path;
        if (path === 'viand:router') {
            script += `  import { router } from "./viand-router.svelte.ts";
`;
        } else if (path.endsWith('.viand')) {
            script += `  import ${i.name} from "${path}";
`;
        } else {
            script += `  import { ${i.name} } from "${path}";
`;
        }
    });
    script += `  import { ${manifest.name}Logic } from "./${manifest.name}.viand.logic.svelte";
`;
    const propNames = manifest.props.map(p => p.id);
    manifest.slots.forEach(s => { if (!propNames.includes(s)) propNames.push(s); });
    if (propNames.length > 0) {
        script += `  let { ${propNames.map(id => {
            const p = manifest.props.find(x => x.id === id);
            return p ? `${id} = $bindable(${p.value})` : id;
        }).join(', ')} } = $props();
`;
    }
    script += `  const _ = new ${manifest.name}Logic();
`;
    manifest.props.forEach(p => script += `  $effect(() => { _.${p.id} = ${p.id}; });
`);
    if (manifest.onMount.length > 0) script += `  onMount(() => _.onMount());
`;
    script += `</script>

`;

    const renderNode = (node: ViewNode, indent: string, localVars: string[] = []): string => {
        const importedNames = manifest.imports.map(i => i.name);
        
        if (node.type === 'text') {
            let content = node.content!.trim();
            const importedNames = manifest.imports.map(i => i.name);
            
            // Fix: If the text is exactly an imported Component name, render it as a tag
            if (importedNames.includes(content) && content[0] === content[0].toUpperCase()) {
                return `${indent}<${content} />\n`;
            }

            // Handle interpolation of $var -> _.var in raw expressions
            if (content.includes('$') || content.includes('+')) {
                let interpolated = content.replace(/\$([a-zA-Z0-9_]+)/g, (match, p1) => {
                    return (localVars.includes(p1) || importedNames.includes(p1)) ? p1 : `_.${p1}`;
                });
                const firstWord = interpolated.split(/[ .(+]/)[0];
                if (importedNames.includes(firstWord) || content.includes('+')) {
                    return `${indent}{${interpolated}}\n`;
                }
                content = interpolated;
            }

            // Normal text with interpolation $var -> {_.var}
            content = cleanViandText(content);
            
            // Fix: If the content IS a known local variable or imported name (e.g. item.text, State.theme), wrap it
            const possibleVar = content.split('.')[0];
            if (localVars.includes(possibleVar) || importedNames.includes(possibleVar)) {
                return `${indent}{${content}}\n`;
            }

            content = content.replace(/\{([a-zA-Z0-9_.]+)\}/g, (match, p1) => {
                const rootVar = p1.split('.')[0];
                if (localVars.includes(rootVar) || importedNames.includes(rootVar)) return `{${p1}}`;
                return `{_.${p1}}`;
            });
            return `${indent}${content}\n`;
        }
        if (node.type === 'slot') return `${indent}{@render ${node.content}()}\n`;
        if (node.type === 'element') {
            const attrParts = Object.entries(node.attrs || {}).map(([k, v]) => {
                let val = v;
                if (v.startsWith('__VIAND_CALL__')) {
                    const rawCall = v.replace('__VIAND_CALL__', '');
                    const funcName = rawCall.split('(')[0];
                    const rootVar = funcName.split('.')[0];
                    const scopedCall = (localVars.includes(rootVar) || importedNames.includes(rootVar)) ? rawCall : `_.${rawCall}`;
                    
                    if (rawCall.includes('...args')) {
                        val = `{(...args) => ${scopedCall}}`;
                    } else {
                        val = `{() => ${scopedCall}}`;
                    }
                } else if (v.startsWith('$')) {
                    const varPath = v.slice(1);
                    const rootVar = varPath.split('.')[0];
                    if (localVars.includes(rootVar) || importedNames.includes(rootVar)) val = `{${varPath}}`;
                    else val = `{_.${rootVar}}`;
                } else if (k.includes(':')) {
                    if (k.startsWith('bind:')) {
                        const rootVar = v.split('.')[0];
                        if (localVars.includes(rootVar) || importedNames.includes(rootVar)) val = `{${v}}`;
                        else val = `{_.${v}}`;
                    } else {
                        val = `{${v}}`;
                    }
                } else if (!v.startsWith('{') && !v.startsWith('"') && !v.startsWith("'")) {
                    val = `"${v}"`;
                }
                return `${k}=${val}`;
            });
            
            if (node.ref) attrParts.push(`bind:this={_.${node.ref}}`);
            
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
                    childrenStr += `${indent}  {/snippet}
`;
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
            return `${indent}{#each _.${node.list} as ${node.item}}
${node.children.map(c => renderNode(c, indent + "  ", newLocalVars)).join('')}${indent}{/each}\n`;
        }
        if (node.type === 'if') {
            let out = `${indent}{#if ${cleanLogic(node.condition!)}} 
${node.children.map(c => renderNode(c, indent + "  ", localVars)).join('')}`;
            if (node.alternate) {
                if (node.alternate.condition === 'true') out += `${indent}{:else}
${node.alternate.children.map(c => renderNode(c, indent + "  ", localVars)).join('')}`; 
                else out += `${indent}{:else if ${cleanLogic(node.alternate.condition!)}} 
${node.alternate.children.map(c => renderNode(c, indent + "  ", localVars)).join('')}`;
            }
            return out + `${indent}{/if}\n`;
        }
        if (node.type === 'match') {
            const rawExpr = node.expression!.startsWith('$') ? node.expression!.slice(1) : node.expression!;
            const rootVar = rawExpr.split('.')[0];
            const e = (localVars.includes(rootVar) || importedNames.includes(rootVar)) ? rawExpr : `_.${rawExpr}`;
            let out = "";
            node.cases!.forEach((c, i) => {
                const header = i === 0 ? `{#if ${e} === ${c.condition}}` : `{:else if ${e} === ${c.condition}}`;
                out += `${indent}${header}
${c.children.map(child => renderNode(child, indent + "  ", localVars)).join('')}`;
            });
            if (node.defaultCase) out += `${indent}{:else}
${node.defaultCase.children.map(child => renderNode(child, indent + "  ", localVars)).join('')}`;
            return out + `${indent}{/if}\n`;
        }
        return "";
    };
    const finalView = manifest.view.map(n => renderNode(n, "" )).join('');
    let style = "";
    if (manifest.styles.length > 0) {
        style = `
<style>
`;
        manifest.styles.forEach(s => {
            style += `  ${s.selector} {
`;
            s.rules.forEach(r => style += `    ${r};
`);
            style += `  }
`;
        });
        style += `</style>
`;
    }
    return script + finalView + style;
}
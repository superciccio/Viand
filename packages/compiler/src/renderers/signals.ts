import { ComponentManifest, ViewNode } from '../types.ts';
import { cleanViandText } from '../parser.ts';

/**
 * ⚛️ Signals Renderer (The Foundry)
 * Compiles Viand Manifest into Pure JS Hyperscript + Signals.
 */
export function generateSignalsJS(manifest: ComponentManifest): string {
    let code = `import { signal, effect, computed, h, renderList } from "./runtime";\n\n`;

    code += `export function ${manifest.name}(__props = {}) {\n`;

    // 1. Reactive State
    manifest.state.forEach(s => {
        code += `  const ${s.id} = signal(${s.value});\n`;
    });

    // 2. Props (Derived)
    manifest.props.forEach(p => {
        code += `  const ${p.id} = computed(() => __props.${p.id} ?? ${p.value});\n`;
    });

    // 3. Actions / Functions
    manifest.functions.forEach(f => {
        code += `  const ${f.name} = (${f.params?.join(', ') || ''}) => {\n`;
        f.body.forEach(line => {
            if (typeof line === 'string') {
                const cleaned = line.replace(/\$([a-zA-Z0-9_]+)/g, '$1.value');
                code += `    ${cleaned.trim()};\n`;
            }
        });
        code += `  };\n`;
    });

    // 4. View (Recursive Hyperscript)
    const renderNode = (node: ViewNode): string => {
        if (node.type === 'text') {
            let content = node.content.trim();
            // Handle prose: remove quotes and plus signs from Viand source
            content = content.replace(/["']\s*\+\s*/g, '').replace(/\+\s*["']/g, '').replace(/["']/g, '');
            
            const hasSignal = /\$([a-zA-Z0-9_]+)/.test(content);
            if (hasSignal) {
                const template = content.replace(/\$([a-zA-Z0-9_]+)/g, '${$1.value}');
                return "computed(() => `" + template + "`)";
            }
            return '"' + content + '"';
        }

        if (node.type === 'element') {
            const tag = node.tag;
            const props: string[] = [];

            Object.entries(node.attrs).forEach(([k, v]) => {
                if (k.startsWith('on')) {
                    const handler = v.replace('__VIAND_CALL__', '').replace(/\(\)$/, '');
                    props.push(k + ": " + handler);
                } else {
                    const val = v.replace(/\$([a-z0-9_]+)/gi, '$1.value');
                    props.push(k + ": " + val);
                }
            });

            const propsStr = "{ " + props.join(', ') + " }";
            const children = node.children.map(renderNode).filter(c => c).join(', ');
            return "h(\"" + tag + "\", " + propsStr + ", [" + children + "])";
        }

        return "null";
    };

    const rootNodes = manifest.view.map(renderNode).filter(n => n !== "null");
    
    if (rootNodes.length === 1) {
        code += `\n  return ${rootNodes[0]};\n`;
    } else {
        code += `\n  return h("div", {}, [${rootNodes.join(', ')}]);\n`;
    }

    code += `}\n`;
    return code;
}
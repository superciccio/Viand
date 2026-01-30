import { ComponentManifest, ViewNode } from '../types.ts';
import { ComponentOutput, ViandWidget, validateOutput } from './schema.ts';
import { emitJS } from './emitter.ts';

/**
 * ⚛️ Signals Renderer (The Architect)
 * Builds a validated Instruction Tree (Widget Tree) from the Manifest.
 */
export function generateSignalsJS(manifest: ComponentManifest): string {
    
    // 0. Memory Module Handling
    if (manifest.isMemory) {
        let code = `import { signal, effect, computed } from "@viand/runtime";\n\n`;
        
        // Map Imports
        manifest.imports.forEach(i => {
            let path = i.path;
            if (path === 'viand:router') path = './viand-router.ts';
            if (path === 'viand:intl') path = './viand-intl.ts';
            if (path === 'viand:notify') path = './viand-notify.ts';
            code += `import { ${i.name} } from "${path}";\n`;
        });

        code += `\n`;
        
        // State signals
        manifest.state.forEach(s => {
             code += `const _${s.id} = signal(${s.value});\n`;
        });
        
        code += `\nexport const ${manifest.name} = {\n`;
        manifest.state.forEach(s => {
             code += `  get ${s.id}() { return _${s.id}.value; },\n`;
             code += `  set ${s.id}(v) { _${s.id}.value = v; },\n`;
        });
        code += `};\n`;
        
        return code;
    }

    // 1. Build the Output Object
    const output: ComponentOutput = {
        name: manifest.name,
        imports: [],
        props: [],
        refs: manifest.refs || [],
        onMount: [],
        watchers: [],
        signals: [],
        actions: [],
        view: { type: 'fragment', children: [] }
    };

    // 1.5 Map Imports
    manifest.imports.forEach(i => {
        let path = i.path;
        if (path === 'viand:router') path = './viand-router.ts';
        if (path === 'viand:intl') path = './viand-intl.ts';
        if (path === 'viand:notify') path = './viand-notify.ts';
        output.imports.push({ name: i.name, path });
    });

    // 1.6 Map Props
    manifest.props.forEach(p => {
        output.props.push({ id: p.id, value: p.value });
    });

    // 1.7 Map Styles
    let css = "";
    manifest.styles.forEach(s => {
        css += `${s.selector} { ${s.rules.join('; ')} }\n`;
    });
    output.css = css;

    // 1.8 Map Lang
    output.lang = manifest.lang;

    // 2. Map State to Signals
    manifest.state.forEach(s => {
        output.signals.push({ id: s.id, value: s.value });
    });

    // 2.1 Map Sync (Reactive) to Derived Signals
    manifest.reactive.forEach(r => {
        const value = r.expression.replace(/\$([a-zA-Z0-9_]+)/g, '$1.value');
        output.signals.push({ id: r.id, value, isDerived: true });
    });

    // 3. Map Functions to Actions
    const processLogic = (lines: any[]): string[] => {
        const output: string[] = [];
        lines.forEach(line => {
            if (typeof line === 'string') {
                // Handle 'raw' keyword (remove it)
                let code = line.replace(/\braw\s+/g, '');
                // Handle '_.ref' mapping to local 'ref.value'
                code = code.replace(/_\.([a-zA-Z0-9_]+)/g, '$1.value');
                output.push(code.replace(/\$([a-zA-Z0-9_]+)/g, '$1.value').trim());
            } else if (line.type === 'js-block') {
                const header = line.body[0];
                let cleanHeader = header.replace(/:$/, '');
                // Handle '_.ref' in block header
                cleanHeader = cleanHeader.replace(/_\.([a-zA-Z0-9_]+)/g, '$1.value');
                cleanHeader = cleanHeader.replace(/\$([a-zA-Z0-9_]+)/g, '$1.value');
                
                // Ensure parens for control flow
                const flowMatch = cleanHeader.match(/^(if|else if|while)\s+(.*)$/);
                if (flowMatch) {
                    const keyword = flowMatch[1];
                    const condition = flowMatch[2];
                    if (!condition.startsWith('(')) {
                        cleanHeader = `${keyword} (${condition})`;
                    }
                }

                output.push(`${cleanHeader} {`);
                output.push(...processLogic(line.body.slice(1)));
                output.push(`}`);
            }
        });
        return output;
    };

    manifest.functions.forEach(f => {
        const body = processLogic(f.body);
        output.actions.push({ name: f.name, params: f.params || [], body });
    });

    // 3.1 Map Watchers
    manifest.watch.forEach(w => {
        const dep = w.dependency.replace(/\$/g, '');
        output.watchers.push({ dependency: dep, body: processLogic(w.body) });
    });

    // 3.2 Map onMount
    output.onMount = processLogic(manifest.onMount);

    // 4. Map ViewNodes to Widgets
    const buildWidget = (node: ViewNode): ViandWidget | null => {
        if (node.type === 'text') {
            let val = node.content.trim();
            const isReactive = /\$([a-zA-Z0-9_]+)/.test(val) || val.includes('.') || val.includes('(');
            
            // Heuristic for pure expression: contains call/member and not wrapped in matching quotes
            const isWrapped = (val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"));
            const isExpression = isReactive && !isWrapped && (val.includes('.') || val.includes('('));

            if (isExpression) {
                return { 
                    type: 'text', 
                    value: val.replace(/\$([a-zA-Z0-9_]+)/g, '$1.value'), 
                    isReactive: true, 
                    isExpression: true 
                };
            }

            val = val.replace(/["']\s*\+\s*/g, '').replace(/\+\s*["']/g, '').replace(/["']/g, '');
            const template = val.replace(/\$([a-zA-Z0-9_]+)/g, '$\{ $1.value \}');
            
            return { type: 'text', value: template, isReactive };
        }

        if (node.type === 'each') {
            return {
                type: 'each',
                list: node.list.replace(/^\$/, ''),
                item: node.item.replace(/^\$/, ''),
                children: node.children.map(buildWidget).filter(w => w !== null) as ViandWidget[]
            };
        }

        if (node.type === 'match') {
            return {
                type: 'match',
                expression: node.expression.replace(/\$([a-z0-9_]+)/gi, '$1.value'),
                cases: (node.cases || []).map(c => ({
                    condition: c.condition,
                    children: c.children.map(buildWidget).filter(w => w !== null) as ViandWidget[]
                })),
                defaultCase: node.defaultCase ? node.defaultCase.children.map(buildWidget).filter(w => w !== null) as ViandWidget[] : undefined
            };
        }

        if (node.type === 'slot') {
            return {
                type: 'slot',
                name: node.content
            };
        }

        if (node.type === 'element') {
            const props: Record<string, string> = {};
            
            Object.entries(node.attrs).forEach(([k, v]) => {
                if (k.startsWith('on')) {
                    props[k] = v.replace('__VIAND_CALL__', '').replace(/\(\)$/, '');
                } else if (k.startsWith('bind:')) {
                    props[k] = v.replace(/\$([a-z0-9_]+)/gi, '$1');
                } else {
                    let newVal = v.replace(/\$([a-z0-9_]+)/gi, '$1.value');
                    if (v.includes('$')) {
                        newVal = `computed(() => ${newVal})`;
                    }
                    props[k] = newVal;
                }
            });

            return {
                type: 'element',
                tag: node.tag,
                isComponent: /^[A-Z]/.test(node.tag),
                ref: node.ref,
                props,
                children: node.children.map(buildWidget).filter(w => w !== null) as ViandWidget[]
            };
        }

        return null;
    };

    // DEBUG: Clone to avoid mutation issues
    const viewCopy = JSON.parse(JSON.stringify(manifest.view));
    const rootWidgets = viewCopy.map(buildWidget).filter((w: any) => w !== null) as ViandWidget[];
    
    if (rootWidgets.length === 1) {
        output.view = rootWidgets[0];
    } else {
        output.view = { type: 'fragment', children: rootWidgets };
    }

    // 5. MANUAL VALIDATION
    const errors = validateOutput(output);
    if (errors.length > 0) {
        throw new Error("Architecture Validation Failed: " + errors.join(", "));
    }

    return emitJS(output);
}

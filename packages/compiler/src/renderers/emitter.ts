import { ComponentOutput, ViandWidget } from './schema.ts';

/**
 * 🖨️ Viand JS Emitter
 * Converts a validated Widget Tree into pure, reactive JavaScript.
 */
export function emitJS(output: ComponentOutput): string {
    let code = `import { signal, effect, computed, h, renderList, renderMatch } from "@viand/runtime";\n`;

    output.imports.forEach(i => {
        code += `import { ${i.name} } from "${i.path}";\n`;
    });

    code += `\n`;

    if (output.css) {
        code += `const style = document.createElement('style');\n`;
        code += `style.textContent = \`${output.css}\`;\n`;
        code += `document.head.appendChild(style);\n\n`;
    }

    if (output.lang && Object.keys(output.lang).length > 0) {
        code += `intl.load(${JSON.stringify(output.lang, null, 2)});\n\n`;
    }

    // 0.3 Register Mocks
    if (Object.keys(output.apiMocks).length > 0 || Object.keys(output.sqlMocks).length > 0) {
        code += `if (typeof window !== 'undefined' && window.viand) {\n`;
        Object.entries(output.apiMocks).forEach(([label, data]) => {
            code += `  window.viand.registerMock("api", "${label}", ${data});\n`;
        });
        Object.entries(output.sqlMocks).forEach(([label, data]) => {
            code += `  window.viand.registerMock("sql", "${label}", ${data});\n`;
        });
        code += `}\n\n`;
    }

    code += `export function ${output.name}(__props = {}) {\n`;

    // 0. Initialize Props
    output.props.forEach(p => {
        code += `  const ${p.id} = signal((__props["${p.id}"] && typeof __props["${p.id}"].peek === 'function') ? __props["${p.id}"].value : (__props["${p.id}"] !== undefined ? __props["${p.id}"] : ${p.value}));\n`;
    });

    // 0.1 Initialize Refs
    output.refs.forEach(r => {
        code += `  const ${r} = signal(null);\n`;
    });

    // 0.2 Initialize Bridges (API & SQL)
    if (output.apiBridge.length > 0) {
        code += `  const api = {\n`;
        output.apiBridge.forEach(label => {
            code += `    ${label}: (...args) => viand.bridge.api("${label}", ...args),\n`;
        });
        code += `  };\n`;
    }

    if (output.sqlBridge.length > 0) {
        code += `  const sql = {\n`;
        output.sqlBridge.forEach(label => {
            // Note: Tauri SQL bridge will eventually replace this for native builds
            code += `    ${label}: (...args) => viand.bridge.sql("${label}", ...args),\n`;
        });
        code += `  };\n`;
    }

    // 1. Emit Signals
    output.signals.forEach(s => {
        if (s.isDerived) {
            code += `  const ${s.id} = computed(() => ${s.value});\n`;
        } else {
            code += `  const ${s.id} = signal(${s.value});\n`;
        }
    });

    // 2. Emit Actions
    output.actions.forEach(a => {
        code += `  const ${a.name} = (${a.params.join(', ')}) => {\n`;
        a.body.forEach(line => code += `    ${line}\n`);
        code += `  };\n`;
    });

    // 2.1 Emit Watchers
    output.watchers.forEach(w => {
        code += `  effect(() => {\n`;
        code += `    if (${w.dependency}.value) {\n`;
        w.body.forEach(line => code += `      ${line}\n`);
        code += `    }\n`;
        code += `  });\n`;
    });

    // 2.2 Emit onMount
    if (output.onMount.length > 0) {
        code += `  effect(() => {\n`;
        output.onMount.forEach(line => code += `    ${line}\n`);
        code += `  });\n`;
    }

    // 3. Emit View (Widget Tree Traversal)
    const printWidget = (w: ViandWidget): string => {
        if (w.type === 'text') {
            if (w.isExpression) return `computed(() => ${w.value})`;
            if (w.isReactive) return "computed(() => `" + w.value + "`)";
            return `"${w.value}"`;
        }

        if (w.type === 'slot') {
            return `h("div", { "style": "display: contents" }, [ ...(__props["${w.name}"] || []) ], null, { type: 'slot', name: '${w.name}', line: ${w.line || 0} })`;
        }

        if (w.type === 'match') {
            const casesStr = w.cases.map(c => `{ condition: ${c.condition}, template: () => h("div", { style: "display: contents" }, [${c.children.map(printWidget).join(', ')}]) }`).join(', ');
            const defaultStr = w.defaultCase ? `() => h("div", { style: "display: contents" }, [${w.defaultCase.map(printWidget).join(', ')}])` : `() => h("div", { style: "display: contents" }, [])`;
            return `renderMatch(computed(() => ${w.expression}), [${casesStr}], ${defaultStr}, { type: 'match', line: ${w.line || 0} })`;
        }

        if (w.type === 'each') {
            const children = w.children.map(printWidget).join(', ');
            return `renderList(${w.list}, (${w.item}) => h("div", { style: "display: contents" }, [${children}]), { type: 'each', line: ${w.line || 0} })`;
        }

        if (w.type === 'element') {
            const propsObj = { ...w.props };
            let childrenArr = w.children.map(printWidget);
            
            const tag = w.isComponent ? w.tag : `"${w.tag}"`;
            const ref = w.ref ? `(v) => ${w.ref}.value = v` : `null`;
            const meta = `{ type: 'element', tag: ${tag}, line: ${w.line || 0} }`;
            
            if (w.isComponent) {
                return `h(${tag}, { "children": [${childrenArr.join(', ')}], ${Object.entries(propsObj).map(([k, v]) => `"${k}": ${v}`).join(', ')} }, [], ${ref}, ${meta})`;
            } else {
                return `h(${tag}, { ${Object.entries(propsObj).map(([k, v]) => `"${k}": ${v}`).join(', ')} }, [${childrenArr.join(', ')}], ${ref}, ${meta})`;
            }
        }

        if (w.type === 'fragment') {
            const children = w.children.map(printWidget).join(', ');
            // In pure DOM, a fragment is often a div or a real fragment. 
            // For now, let's use a wrapper div.
            return `h("div", { "class": "fragment" }, [${children}], null, { type: 'fragment', line: ${w.line || 0} })`;
        }

        return "null";
    };

    code += `\n  return ${printWidget(output.view)};\n`;
    code += `}\n`;

    return code;
}
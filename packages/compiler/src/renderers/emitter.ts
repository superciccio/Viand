import { ComponentOutput, ViandWidget } from './schema.ts';

/**
 * 🖨️ Viand JS Emitter
 * Converts a validated Widget Tree into pure, reactive JavaScript.
 */
export function emitJS(output: ComponentOutput): string {
    let code = `import { signal, effect, computed, h, renderList, renderMatch, api } from "@viand/runtime";\n`;

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

    code += `export function ${output.name}(__props = {}) {\n`;

    // 0. Initialize Props
    output.props.forEach(p => {
        code += `  const ${p.id} = signal((__props["${p.id}"] && typeof __props["${p.id}"].peek === 'function') ? __props["${p.id}"].value : (__props["${p.id}"] !== undefined ? __props["${p.id}"] : ${p.value}));\n`;
    });

    // 0.1 Initialize Refs
    output.refs.forEach(r => {
        code += `  const ${r} = signal(null);\n`;
    });

    // Debug: Print the Widget Tree
    code += `  console.log("Viand Widget Tree for ${output.name}:", ${JSON.stringify(output.view, null, 2)});\n`;

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
            return `h("div", { "style": "display: contents" }, [ ...(__props["${w.name}"] || []) ])`;
        }

        if (w.type === 'match') {
            const casesStr = w.cases.map(c => `{ condition: ${c.condition}, template: () => h("div", { style: "display: contents" }, [${c.children.map(printWidget).join(', ')}]) }`).join(', ');
            const defaultStr = w.defaultCase ? `() => h("div", { style: "display: contents" }, [${w.defaultCase.map(printWidget).join(', ')}])` : `() => h("div", { style: "display: contents" }, [])`;
            return `renderMatch(computed(() => ${w.expression}), [${casesStr}], ${defaultStr})`;
        }

        if (w.type === 'each') {
            const children = w.children.map(printWidget).join(', ');
            return `renderList(${w.list}, (${w.item}) => h("div", { style: "display: contents" }, [${children}]))`;
        }

        if (w.type === 'element') {
            const propsObj = { ...w.props };
            let childrenArr = w.children.map(printWidget);
            
            const tag = w.isComponent ? w.tag : `"${w.tag}"`;
            const ref = w.ref ? `(v) => ${w.ref}.value = v` : `null`;
            
            if (w.isComponent) {
                return `h(${tag}, { "children": [${childrenArr.join(', ')}], ${Object.entries(propsObj).map(([k, v]) => `"${k}": ${v}`).join(', ')} }, [], ${ref})`;
            } else {
                return `h(${tag}, { ${Object.entries(propsObj).map(([k, v]) => `"${k}": ${v}`).join(', ')} }, [${childrenArr.join(', ')}], ${ref})`;
            }
        }

        if (w.type === 'fragment') {
            const children = w.children.map(printWidget).join(', ');
            // In pure DOM, a fragment is often a div or a real fragment. 
            // For now, let's use a wrapper div.
            return `h("div", { "class": "fragment" }, [${children}])`;
        }

        return "null";
    };

    code += `\n  return ${printWidget(output.view)};\n`;
    code += `}\n`;

    return code;
}
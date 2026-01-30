import { ComponentManifest, ManifestFunction } from '../types.ts';

/**
 * 🧠 Logic Factory Renderer
 * Generates a stable, closure-based factory function for component logic.
 */
export function generateLogicClass(manifest: ComponentManifest): string {
    // 1. Identify local dependencies for the closure
    const renderBody = (body: (string | ManifestFunction)[], indent: string): string => body.map(line => {
        if (typeof line === 'string') {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#') || trimmedLine.startsWith('//')) return "";
            let cleaned = line.replace(/\braw\s+\$([a-zA-Z0-9_]+)/g, 'JSON.parse(JSON.stringify($1))');
            cleaned = cleaned.replace(/\$([a-zA-Z0-9_]+)/g, '$1');
            cleaned = cleaned.replace(/\b_\./g, ''); // In closures, _. disappears
            cleaned = cleaned.replace(/\bsql\./g, 'sql.');
            cleaned = cleaned.replace(/\bapi\./g, 'api.');
            return `${indent}${cleaned.trim()}\n`;
        } else if (line.type === 'js-block') {
            const rawH = line.body[0].toString().trim();
            let h = rawH.replace(/^if\s+(.*):$/, 'if ($1) {');
            h = h.replace(/\braw\s+\$([a-zA-Z0-9_]+)/g, 'JSON.parse(JSON.stringify($1))');
            h = h.replace(/\$([a-zA-Z0-9_]+)/g, '$1');
            h = h.replace(/\b_\./g, '');
            h = h.replace(/\bapi\./g, 'api.');
            return `${indent}${h}\n${renderBody(line.body.slice(1), indent + "    ")}${indent}}\n`;
        }
        return "";
    }).join('');

    let code = `  function create${manifest.name}Logic(__props) {\n`;
    
    // 2. Reactive State (Closure Scoped)
    manifest.refs.forEach(ref => code += `    let ${ref} = $state(undefined);\n`);
    manifest.state.forEach(s => code += `    let ${s.id} = $state(${s.value});\n`);
    manifest.props.forEach(p => code += `    let ${p.id} = $derived(__props.${p.id});\n`);
    
    manifest.reactive.forEach(r => {
        const expr = r.expression.replace(/\$([a-zA-Z0-9_]+)/g, '$1');
        if (expr.includes('api.') || expr.includes('(')) {
            code += `    let ${r.id} = $state(undefined);\n`;
        } else {
            code += `    let ${r.id} = $derived(${expr.replace(/\bapi\./g, 'api.')});\n`;
        }
    });

    // 3. Side Effects
    if (Object.keys(manifest.lang).length > 0) {
        code += `    intl.load(${JSON.stringify(manifest.lang)});
`;
    }

    manifest.reactive.forEach(r => {
        const expr = r.expression.replace(/\$([a-zA-Z0-9_]+)/g, '$1');
        if (expr.includes('api.') || expr.includes('(')) {
            code += `    $effect(() => {\n`;
            code += `      (async () => { ${r.id} = await ${expr.replace(/\bapi\./g, 'api.')}; })();\n`;
            code += `    });\n`;
        }
    });

    manifest.watch.forEach(w => {
        const dep = w.dependency.replace(/\$([a-zA-Z0-9_]+)/g, '$1');
        code += `    $effect(() => {\n`;
        code += `      const __dep = ${dep};\n`;
        code += renderBody(w.body, "      ");
        code += `    });\n`;
    });

    // 4. Methods & Actions
    manifest.functions.forEach(f => {
        code += `\n    function ${f.name}(${f.params?.join(', ')}) {\n`;
        code += renderBody(f.body, "      ");
        code += `    }\n`;
    });

    // 5. Shared Resources (SQL/API)
    if (manifest.queries.length > 0) {
        code += `    const sql = {\n`;
        manifest.queries.forEach(q => {
            code += `      ${q.label}: (...args) => { console.log("SQL EXEC [${q.label}]", args); return []; },\n`;
        });
        code += `    };
`;
    }

    if (manifest.api.length > 0) {
        code += `    const api = {\n`;
        code += `      baseUrl: '',\n`;
        manifest.api.forEach(endpoint => {
            code += `      ${endpoint.label}: async (vars = {}) => {\n`;
            code += `        const url = new URL(api.baseUrl + "${endpoint.path}", window.location.origin);
`;
            Object.entries(endpoint.query || {}).forEach(([k, v]) => {
                code += `        url.searchParams.set("${k}", String(vars.${k} || ${v}));\n`;
            });
            code += `        try {
`;
            code += `          const res = await fetch(url, { method: "${endpoint.method}", headers: ${JSON.stringify(endpoint.headers || {})} });
`;
            code += `          if (res.ok) { const ct = res.headers.get("content-type"); if (ct && ct.includes("json")) return await res.json(); }
`;
            code += `        } catch (e) { }
`;
            if (endpoint.mock) code += `        return ${endpoint.mock.trim()};
`;
            code += `        return null;
`;
            code += `      },
`;
        });
        code += `    };
`;
    }

    // 6. Public Interface (The "Bridge" object)
    code += `\n    return {\n`;
    manifest.refs.forEach(r => code += `      get ${r}() { return ${r}; }, set ${r}(v) { ${r} = v; },\n`);
    manifest.state.forEach(s => code += `      get ${s.id}() { return ${s.id}; }, set ${s.id}(v) { ${s.id} = v; },\n`);
    manifest.props.forEach(p => code += `      get ${p.id}() { return ${p.id}; },\n`);
    manifest.reactive.forEach(r => code += `      get ${r.id}() { return ${r.id}; },\n`);
    manifest.functions.forEach(f => code += `      ${f.name},
`);
    if (manifest.onMount.length > 0) {
        code += `      async onMount() {\n`;
        code += renderBody(manifest.onMount, "        ");
        code += `      },
`;
    }
    if (manifest.queries.length > 0) code += `      sql,
`;
    if (manifest.api.length > 0) code += `      api,
`;
    code += `    };
`;
    code += `  }
`;

    return code;
}
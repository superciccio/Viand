import { ComponentManifest, ManifestFunction } from '../types.ts';

/**
 * 🧠 Iron Logic Renderer
 * Generates a closure-based logic factory that uses Svelte 5 runes.
 * Designed to be embedded directly inside a Svelte component script tag.
 */
export function generateLogicClass(manifest: ComponentManifest): string {
    const renderBody = (body: (string | ManifestFunction)[], indent: string): string => body.map(line => {
        if (typeof line === 'string') {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#') || trimmedLine.startsWith('//')) return "";
            let cleaned = line.replace(/\braw\s+\$([a-zA-Z0-9_]+)/g, 'JSON.parse(JSON.stringify($1))');
            cleaned = cleaned.replace(/\$([a-zA-Z0-9_]+)/g, '$1');
            cleaned = cleaned.replace(/\b_\./g, ''); 
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

    let code = `  function create${manifest.name}Logic(__props) {
`;
    
    // 1. Reactive State (Closure Scoped)
    manifest.refs.forEach(ref => code += `    let ${ref} = $state(undefined);
`);
    manifest.state.forEach(s => code += `    let ${s.id} = $state(${s.value});
`);
    
    // 2. Props (Derived from __props)
    manifest.props.forEach(p => code += `    let ${p.id} = $derived(__props.${p.id});
`);
    
    manifest.reactive.forEach(r => {
        const expr = r.expression.replace(/\$([a-zA-Z0-9_]+)/g, '$1');
        if (expr.includes('api.') || expr.includes('(')) {
            code += `    let ${r.id} = $state(undefined);
`;
        } else {
            code += `    let ${r.id} = $derived(${expr.replace(/\bapi\./g, 'api.')});
`;
        }
    });

    // 3. Side Effects (LoadIntl)
    if (Object.keys(manifest.lang).length > 0) {
        code += `    intl.load(${JSON.stringify(manifest.lang)});
`;
    }

    // 4. Async Syncs
    manifest.reactive.forEach(r => {
        const expr = r.expression.replace(/\$([a-zA-Z0-9_]+)/g, '$1');
        if (expr.includes('api.') || expr.includes('(')) {
            code += `    $effect(() => { (async () => { ${r.id} = await ${expr.replace(/\bapi\./g, 'api.')}; })(); });
`;
        }
    });

    // 5. Shared Resources
    if (manifest.queries.length > 0) {
        code += `    const sql = {
`;
        manifest.queries.forEach(q => {
            code += `      ${q.label}: (...args) => { console.log("SQL EXEC [${q.label}]", args); return []; },
`;
        });
        code += `    };
`;
    }

    if (manifest.api.length > 0) {
        code += `    const api = {
`;
        code += `      baseUrl: '',
`;
        manifest.api.forEach(endpoint => {
            code += `      ${endpoint.label}: async (vars = {}) => {
`;
            code += `        const url = new URL(api.baseUrl + "${endpoint.path}", window.location.origin);
`;
            Object.entries(endpoint.query || {}).forEach(([k, v]) => {
                code += `        url.searchParams.set("${k}", String(vars.${k} || ${v}));
`;
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

    // 6. Public Interface (Returning getters/setters for closure variables)
    code += `
    return {
`;
    manifest.refs.forEach(r => code += `      get ${r}() { return ${r}; }, set ${r}(v) { ${r} = v; },
`);
    manifest.state.forEach(s => code += `      get ${s.id}() { return ${s.id}; }, set ${s.id}(v) { ${s.id} = v; },
`);
    manifest.props.forEach(p => code += `      get ${p.id}() { return ${p.id}; },
`);
    manifest.reactive.forEach(r => code += `      get ${r.id}() { return ${r.id}; },
`);
    manifest.functions.forEach(f => {
        code += `      ${f.name}(${f.params?.join(', ')}) {
`;
        code += renderBody(f.body, "        ");
        code += `      },
`;
    });
    if (manifest.onMount.length > 0) {
        code += `      async onMount() {
`;
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

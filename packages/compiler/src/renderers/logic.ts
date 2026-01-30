import { ComponentManifest, ManifestFunction } from '../types.ts';

export function generateLogicClass(manifest: ComponentManifest): string {
    let script = "";
    manifest.imports.forEach(i => {
        let path = i.path;
        if (path === 'viand:router') {
            script += `import { router } from "./viand-router.svelte.ts";\n`;
        } else if (path.endsWith('.viand')) {
            return; 
        } else {
            script += `import { ${i.name} } from "${path}";\n`;
        }
    });

    let code = `${script}\nexport class ${manifest.name}Logic {\n`;
    
    // 1. Fields
    manifest.refs.forEach(ref => code += `  ${ref} = $state(undefined);\n`);
    manifest.state.forEach(s => code += `  ${s.id} = $state(${s.value});\n`);
    manifest.props.forEach(p => code += `  ${p.id} = $state(${p.value});\n`);
    
    // 2. Reactive / Sync (Derived or Async State)
    manifest.reactive.forEach(r => {
        const expr = r.expression.replace(/\$([a-zA-Z0-9_]+)/g, 'this.$1');
        if (expr.includes('api.') || expr.includes('(')) {
            // Async Sync: Needs a backing state
            code += `  ${r.id} = $state(undefined);\n`;
        } else {
            // Pure Derived
            code += `  ${r.id} = $derived(${expr.replace(/\bapi\./g, 'this.api.')});\n`;
        }
    });

    const renderBody = (body: (string | ManifestFunction)[], indent: string): string => body.map(line => {
        if (typeof line === 'string') {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#') || trimmedLine.startsWith('//')) return "";
            
            // Fix: 'raw' uses JSON snapshot for maximum compatibility with JS libs
            let cleaned = line.replace(/\braw\s+\$([a-zA-Z0-9_]+)/g, 'JSON.parse(JSON.stringify(this.$1))');
            
            cleaned = cleaned.replace(/\$([a-zA-Z0-9_]+)/g, 'this.$1');
            cleaned = cleaned.replace(/\b_\./g, 'this.'); 
            cleaned = cleaned.replace(/\bsql\./g, 'this.sql.');
            cleaned = cleaned.replace(/\bapi\./g, 'this.api.');
            return `${indent}${cleaned}\n`;
        } else if (line.type === 'js-block') {
            const rawH = line.body[0].toString().trim();
            let h = rawH.replace(/^if\s+(.*):$/, 'if ($1) {');
            
            // Fix: handle 'raw' in block headers
            h = h.replace(/\braw\s+\$([a-zA-Z0-9_]+)/g, 'JSON.parse(JSON.stringify(this.$1))');
            
            h = h.replace(/\$([a-zA-Z0-9_]+)/g, 'this.$1');
            h = h.replace(/\b_\./g, 'this.');
            h = h.replace(/\bapi\./g, 'this.api.');
            return `${indent}${h}\n${renderBody(line.body.slice(1), indent + "  ")}${indent}}\n`;
        }
        return "";
    }).join('');

    // 3. Constructor (Sync & Watch)
    code += `\n  constructor() {\n`;
    
    manifest.reactive.forEach(r => {
        const expr = r.expression.replace(/\$([a-zA-Z0-9_]+)/g, 'this.$1');
        if (expr.includes('api.') || expr.includes('(')) {
            code += `    $effect(() => {\n`;
            code += `      (async () => {\n`;
            code += `        this.${r.id} = await ${expr.replace(/\bapi\./g, 'this.api.')};\n`;
            code += `      })();\n`;
            code += `    });\n`;
        }
    });

    manifest.watch.forEach(w => {
        const dep = w.dependency.replace(/\$([a-zA-Z0-9_]+)/g, 'this.$1');
        code += `    $effect(() => {\n`;
        code += `      const __dep = ${dep};\n`;
        code += renderBody(w.body, "      ");
        code += `    });\n`;
    });
    
    code += `  }\n`;

    // 4. Methods
    manifest.functions.forEach(f => {
        code += `\n  ${f.name}(${f.params?.join(', ')}) {\n`;
        code += renderBody(f.body, "    ");
        code += `  }\n`;
    });

    if (manifest.queries.length > 0) {
        code += `\n  sql = {\n`;
        manifest.queries.forEach(q => {
            code += `    ${q.label}: (...args: any[]) => {\n`;
            code += `      console.log("SQL EXEC [${q.label}]: ${q.query.replace(/\n/g, ' ')}", args);\n`;
            return [];
        });
        code += `  }\n`;
    }

    if (manifest.api.length > 0) {
        code += `\n  api = {\n`;
        code += `    baseUrl: '', \n`;
        manifest.api.forEach(endpoint => {
            code += `    ${endpoint.label}: async (vars: any = {}) => {\n`;
            code += `      const url = new URL(this.api.baseUrl + "${endpoint.path}", window.location.origin);\n`;
            Object.entries(endpoint.query || {}).forEach(([k, v]) => {
                code += `      url.searchParams.set("${k}", String(vars.${k} || ${v}));\n`;
            });
            code += `      try {\n`;
            code += `        const res = await fetch(url, { method: "${endpoint.method}", headers: ${JSON.stringify(endpoint.headers || {})} });\n`;
            code += `        if (res.ok) { const ct = res.headers.get("content-type"); if (ct && ct.includes("json")) return await res.json(); }\n`;
            code += `      } catch (e) { }\n`;
            if (endpoint.mock) code += `      return ${endpoint.mock.trim()};\n`;
            code += `      return null;\n`;
            code += `    },\n`;
        });
        code += `  }\n`;
    }

    if (manifest.onMount.length > 0) {
        code += `\n  async onMount() {\n`;
        code += renderBody(manifest.onMount, "    ");
        code += `  }\n`;
    }
    
    code += `}\n`;
    if (manifest.isMemory) code += `\nexport const ${manifest.name} = new ${manifest.name}Logic();\n`;
    return code;
}

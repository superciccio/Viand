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
    
    // Lifecycle: refs
    manifest.refs.forEach(ref => code += `  ${ref} = $state(undefined);\n`);
    
    manifest.state.forEach(s => code += `  ${s.id} = $state(${s.value});\n`);
    manifest.props.forEach(p => code += `  ${p.id} = $state(${p.value});\n`);
    manifest.reactive.forEach(r => {
        const expr = r.expression.replace(/\$([a-zA-Z0-9_]+)/g, 'this.$1');
        code += `  ${r.id} = $derived(${expr});\n`;
    });

    manifest.functions.forEach(f => {
        code += `\n  ${f.name}(${f.params?.join(', ')}) {\n`;
        const renderBody = (body: (string | ManifestFunction)[], indent: string): string => body.map(line => {
            if (typeof line === 'string') {
                const trimmedLine = line.trim();
                if (!trimmedLine || trimmedLine.startsWith('#') || trimmedLine.startsWith('//')) return "";
                let cleaned = line.replace(/\$([a-zA-Z0-9_]+)/g, 'this.$1');
                cleaned = cleaned.replace(/\b_\./g, 'this.'); 
                cleaned = cleaned.replace(/\bsql\./g, 'this.sql.');
                cleaned = cleaned.replace(/\bapi\./g, 'this.api.');
                return `${indent}${cleaned};\n`;
            } else if (line.type === 'js-block') {
                const rawH = line.body[0].toString().trim();
                let h = rawH.replace(/^if\s+(.*):$/, 'if ($1) {');
                h = h.replace(/\$([a-zA-Z0-9_]+)/g, 'this.$1');
                return `${indent}${h}\n${renderBody(line.body.slice(1), indent + "  ")}${indent}}\n`;
            }
            return "";
        }).join('');
        code += renderBody(f.body, "    ");
        code += `  }\n`;
    });

    if (manifest.queries.length > 0) {
        code += `\n  sql = {\n`;
        manifest.queries.forEach(q => {
            code += `    ${q.label}: (...args: any[]) => {\n`;
            code += `      console.log("SQL EXEC [${q.label}]: ${q.query.replace(/\n/g, ' ')}", args);\n`;
            code += `      return [];\n`;
            code += `    },\n`;
        });
        code += `  }\n`;
    }

    if (manifest.api.length > 0) {
        code += `\n  api = {\n`;
        code += `    baseUrl: '', \n`;
        manifest.api.forEach(endpoint => {
            code += `    ${endpoint.label}: async (vars: any = {}) => {\n`;
            code += `      const url = new URL(this.api.baseUrl + "${endpoint.path}", window.location.origin);
`;
            Object.entries(endpoint.query || {}).forEach(([k, v]) => {
                code += `      url.searchParams.set("${k}", String(vars.${k} || ${v}));\n`;
            });
            code += `      const res = await fetch(url, {\n`;
            code += `        method: "${endpoint.method}",\n`;
            code += `        headers: ${JSON.stringify(endpoint.headers || {})}\n`;
            code += `      });\n`;
            code += `      return res.json();\n`;
            code += `    },\n`;
        });
        code += `  }\n`;
    }

    if (manifest.onMount.length > 0) {
        code += `\n  async onMount() {\n`;
        const mountBody = manifest.onMount.map(line => {
            let cleaned = line.replace(/\$([a-zA-Z0-9_]+)/g, 'this.$1');
            cleaned = cleaned.replace(/\b_\./g, 'this.');
            cleaned = cleaned.replace(/\bapi\./g, 'this.api.');
            return cleaned;
        }).join('\n    ');
        code += `    ${mountBody}\n`;
        code += `  }\n`;
    }
    
    code += `}\n`;
    if (manifest.isMemory) code += `\nexport const ${manifest.name} = new ${manifest.name}Logic();\n`;
    return code;
}

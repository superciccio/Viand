import { ComponentManifest, ManifestFunction } from '../types.ts';
import { cleanLogic } from '../parser.ts';

export function generateLogicClass(manifest: ComponentManifest): string {
    let code = `export class ${manifest.name}Logic {
`;
    manifest.state.forEach(s => code += `  ${s.id} = $state(${s.value});
`);
    manifest.props.forEach(p => code += `  ${p.id} = $state(${p.value});
`);
    manifest.reactive.forEach(r => {
        const expr = r.expression.replace(/\$([a-zA-Z0-9_]+)/g, 'this.$1');
        code += `  ${r.id} = $derived(${expr});
`;
    });

    manifest.functions.forEach(f => {
        code += `
  ${f.name}(${f.params?.join(', ')}) {
`;
        const renderBody = (body: (string | ManifestFunction)[], indent: string): string => body.map(line => {
            if (typeof line === 'string') {
                const trimmedLine = line.trim();
                if (!trimmedLine || trimmedLine.startsWith('#') || trimmedLine.startsWith('//')) return "";
                let cleaned = line.replace(/\$([a-zA-Z0-9_]+)/g, 'this.$1');
                cleaned = cleaned.replace(/\bsql\./g, 'this.sql.');
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
        code += `  }
`;
    });

    if (manifest.queries.length > 0) {
        code += `
  sql = {
`;
        manifest.queries.forEach(q => {
            code += `    ${q.label}: (...args: any[]) => {
`;
            code += `      console.log("SQL EXEC [${q.label}]: ${q.query.replace(/\n/g, ' ')}", args);
`;
            code += `      return [];
`;
            code += `    },
`;
        });
        code += `  }
`;
    }
    code += `}
`;
    if (manifest.isMemory) code += `
export const ${manifest.name} = new ${manifest.name}Logic();
`;
    return code;
}

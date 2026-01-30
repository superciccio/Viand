import type { ComponentManifest } from '../types.ts';

/**
 * 🗄️ SQL Renderer (The Data Bridge)
 * Transpiles Viand .sql DSL into Nitro (H3) event handlers with real DB support.
 */
export function generateSqlHandler(manifest: ComponentManifest): string {
    if (!manifest.sql || manifest.sql.length === 0) {
        return "import { eventHandler } from 'h3';\n\nexport default eventHandler(() => ({ error: 'No SQL queries defined' }));\n";
    }

    let code = "import { eventHandler, readBody, getMethod, getRouterParams } from 'h3';\n";
    code += "// @ts-ignore\n";
    code += "import getDB from './db.js';\n\n";

    code += "export default eventHandler(async (event) => {\n";
    code += "  const method = getMethod(event).toUpperCase();\n";
    code += "  const params = getRouterParams(event);\n";

    // Robust URL parsing
    code += "  let urlObj;\n";
    code += "  try {\n";
    code += "    // Fallback base for relative paths\n";
    code += "    urlObj = new URL(event.path || '', 'http://localhost');\n";
    code += "  } catch (e) {\n";
    code += "    urlObj = new URL('http://localhost');\n";
    code += "  }\n";

    code += "  const queryParams = Object.fromEntries(urlObj.searchParams);\n";
    code += "  let label = urlObj.searchParams.get('__label');\n";
    code += "  let body: any = {};\n";
    code += "  \n";
    code += "  if (method !== 'GET') {\n";
    code += "    try {\n";
    code += "      body = await readBody(event) || {};\n";
    code += "      if (body.__label) label = body.__label;\n";
    code += "    } catch (e) {}\n";
    code += "  }\n\n";

    code += "  // Combine all possible parameter sources\n";
    code += "  const allParams = { ...queryParams, ...params, ...body };\n\n";

    manifest.sql.forEach((sql, index) => {
        const condition = index === 0 ? "if" : "else if";

        code += `  ${condition} (label === "${sql.label}" || (method === "${sql.method}" && event.path.startsWith("${sql.path.split(':')[0]}"))) {\n`;
        code += `    console.log("🗄️ Viand SQL Execute: ${sql.label}");\n`;
        code += `    const db = getDB();\n`;

        const isSelect = sql.query.trim().toUpperCase().startsWith('SELECT');

        code += "    try {\n";
        if (isSelect) {
            code += `      const stmt = db.prepare(\`${sql.query.trim().replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`);\n`;
            code += "      const result = stmt.all(allParams);\n";
            code += "      return result;\n";
        } else {
            code += `      const stmt = db.prepare(\`${sql.query.trim().replace(/`/g, '\\`').replace(/\${/g, '\\${')}\`);\n`;
            code += "      const result = stmt.run(allParams);\n";
            code += "      return { success: true, ...result };\n";
        }
        code += "    } catch (err: any) {\n";
        code += `      return { fatal: true, error: err.message, label: "${sql.label}" };\n`;
        code += "    }\n";
        code += "  }\n";
    });

    code += "\n  return {\n";
    code += "    error: 'No matching Viand SQL endpoint found',\n";
    code += "    path: event.path,\n";
    code += "    method\n";
    code += "  };\n";
    code += "});\n";

    return code;
}

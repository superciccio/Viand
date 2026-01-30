import type { ComponentManifest } from '../types.ts';

/**
 * 🚀 Nitro Renderer (The Bridge Builder)
 * Transpiles Viand .api DSL into Nitro (H3) event handlers.
 */
export function generateNitroHandler(manifest: ComponentManifest): string {
    if (!manifest.api || manifest.api.length === 0) {
        return `import { eventHandler } from 'h3';\n\nexport default eventHandler(() => ({ error: "No API endpoints defined" }));\n`;
    }

    let code = `import { eventHandler, readBody, getMethod, getRouterParams } from 'h3';\n\n`;
    code += `declare const process: any;\n\n`;

    code += `export default eventHandler(async (event) => {\n`;
    code += `  const method = getMethod(event).toUpperCase();\n`;
    code += `  const params = getRouterParams(event);\n`;
    code += `  // Discovery logic: Try to find which labeled endpoint is being called\n`;
    code += `  const url = new URL(event.path, 'http://localhost');\n`;
    code += `  let label = url.searchParams.get('__label');\n`;
    code += `  \n`;
    code += `  if (method !== 'GET') {\n`;
    code += `    // We attempt to read the body for discovery, but avoid crashing if it's empty/invalid\n`;
    code += `    try {\n`;
    code += `      const body: any = await readBody(event);\n`;
    code += `      if (body && body.__label) label = body.__label;\n`;
    code += `    } catch (e) {\n`;
    code += `      // Silent catch: body discovery is optional\n`;
    code += `    }\n`;
    code += `  }\n\n`;

    manifest.api.forEach((api, index) => {
        const condition = index === 0 ? `if` : `else if`;

        // Multi-layered matching: Label OR Path/Method
        // TODO: Use a proper router matcher for complex paths
        code += `  ${condition} (label === "${api.label}" || (method === "${api.method}" && event.path.startsWith("${api.path.split(':')[0]}"))) {\n`;

        if (api.logic) {
            code += `    console.log("⚡ Viand API Match: ${api.label} (Logic)");\n`;
            // Re-indent logic lines to match the handler structure
            const logicBody = api.logic.trim().split('\n').map(l => `    ${l}`).join('\n');
            code += `${logicBody}\n`;
        } else if (api.mock) {
            code += `    console.log("🎯 Viand API Match: ${api.label} (Mock)");\n`;
            code += `    return ${api.mock.trim()};\n`;
        } else {
            code += `    return { success: true, message: "Endpoint ${api.label} hit (No mock/logic)" };\n`;
        }
        code += `  }\n`;
    });

    code += `\n  return {\n`;
    code += `    error: "No matching Viand API endpoint found",\n`;
    code += `    path: event.path,\n`;
    code += `    method,\n`;
    code += `    label,\n`;
    code += `    params\n`;
    code += `  };\n`;
    code += `});\n`;

    return code;
}

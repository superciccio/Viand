import { ComponentManifest } from '../types.ts';

export function generateTests(manifest: ComponentManifest): string {
    if (manifest.tests.length === 0) return "";
    let code = `import { describe, it, expect } from 'vitest';\n`;
    code += `import { render, fireEvent, screen } from '@testing-library/svelte';\n`;
    code += `import { ${manifest.name}Logic } from './${manifest.name}.viand.logic.svelte';\n`;
    code += `import ${manifest.name} from './${manifest.name}.viand';\n\n`;

    manifest.tests.forEach(suite => {
        code += `describe('${manifest.name} ${suite.type}', () => {\n`;
        code += `  it('should pass ${suite.type} verification', async () => {\n`;
        
        if (suite.type === 'logic') {
            code += `    const _ = new ${manifest.name}Logic();\n`;
        } else if (suite.type === 'ui') {
            code += `    render(${manifest.name});\n`;
        }

        suite.body.forEach(line => {
            if (typeof line === 'object' && line.type === 'must') {
                const rawLine = line.expression;
                if (suite.type === 'ui' && (rawLine.includes('have ') || rawLine.includes('find '))) {
                    const selectorMatch = rawLine.match(/["'](.*?)["']/);
                    const selector = selectorMatch ? selectorMatch[1] : "";
                    const textMatch = rawLine.match(/with text ["'](.*?)["']/);
                    const text = textMatch ? textMatch[1] : "";
                    if (text) {
                        code += `    expect(screen.getByText(/${text}/i)).toBeInTheDocument();\n`;
                    } else if (selector) {
                        code += `    expect(document.querySelector("${selector}")).toBeInTheDocument();\n`;
                    }
                } else {
                    let expr = rawLine.replace(/\$([a-zA-Z0-9_]+)/g, '_.$1');
                    code += `    expect(${expr}).toBeTruthy();\n`;
                }
            } else if (typeof line === 'string') {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('//')) return;
                
                if (suite.type === 'ui') {
                    if (trimmed.startsWith('click ')) {
                        const selectorMatch = trimmed.match(/["'](.*?)["']/);
                        const selector = selectorMatch ? selectorMatch[1] : "button";
                        code += `    await fireEvent.click(document.querySelector("${selector}")!);\n`;
                    }
                } else {
                    let cleaned = trimmed.replace(/\$([a-zA-Z0-9_]+)/g, '_.$1');
                    manifest.functions.forEach(f => {
                        const search = f.name + "(";
                        if (cleaned.includes(search) && !cleaned.includes("_. " + search)) {
                            cleaned = cleaned.replace(search, "_. " + search);
                        }
                    });
                    code += `    ${cleaned};\n`;
                }
            }
        });
        
        code += `  });\n`;
        code += `});\n`;
    });
    return code;
}

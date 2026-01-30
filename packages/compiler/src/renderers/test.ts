import { ComponentManifest } from '../types.ts';

export function generateTests(manifest: ComponentManifest): string {
    let code = `import { describe, it, expect, beforeEach, vi } from 'vitest';\n`;
    code += `import { screen, fireEvent } from '@testing-library/dom';\n`;
    code += `import { mount } from '@viand/runtime';\n`;
    code += `import { ${manifest.name} } from './${manifest.name}.viand';\n\n`;

    code += `describe('${manifest.name} Component', () => {\n`;
    code += `  beforeEach(() => {\n`;
    code += `    document.body.innerHTML = '<div id="app"></div>';\n`;
    code += `    const target = document.getElementById('app')!;\n`;
    code += `    mount(target, () => ${manifest.name}());\n`;
    code += `  });\n\n`;

    manifest.tests.forEach(t => {
        code += `  it('${t.type} verification', async () => {\n`;
        
        // Track SQL/API mocks to wrap them in viand.use
        const sqlMocks: Record<string, string> = {};
        const apiMocks: Record<string, string> = {};

        t.body.forEach(line => {
            if (typeof line === 'string') {
                const trimmed = line.trim();
                if (trimmed.startsWith('#')) return;

                // Handle SQL Mocking
                if (trimmed.startsWith('set sql.')) {
                    const match = trimmed.match(/set sql\.(\w+)\s*=\s*(.*)/);
                    if (match) sqlMocks[match[1]] = match[2];
                    return;
                }

                // Handle API Mocking
                if (trimmed.startsWith('set api.')) {
                    const match = trimmed.match(/set api\.(\w+)\s*=\s*(.*)/);
                    if (match) apiMocks[match[1]] = match[2];
                    return;
                }

                // Handle 'must find'
                if (trimmed.includes('must find')) {
                    const match = trimmed.match(/must find "([^"]+)" with text "([^"]+)"/);
                    if (match) {
                        code += `    expect(screen.getByText(/${match[2]}/i)).toBeTruthy();\n`;
                    }
                    return;
                }

                // Handle 'click'
                if (trimmed.includes('click')) {
                    const match = trimmed.match(/click "([^"]+)" with text "([^"]+)"/);
                    if (match) {
                        code += `    await fireEvent.click(screen.getByText(/${match[2]}/i));\n`;
                    }
                    return;
                }

                // Handle 'set $var' (input binding)
                if (trimmed.startsWith('set $')) {
                    const match = trimmed.match(/set \$(\w+)\s*=\s*(.*)/);
                    if (match) {
                        // Naive: try to find by placeholder or label
                        code += `    const input_${match[1]} = document.querySelector('input');\n`;
                        code += `    if (input_${match[1]}) await fireEvent.input(input_${match[1]}, { target: { value: ${match[2]} } });\n`;
                    }
                    return;
                }

                // Handle 'must sql.name called'
                if (trimmed.startsWith('must sql.')) {
                    const match = trimmed.match(/must sql\.(\w+) called with (.*)/);
                    if (match) {
                        code += `    expect(viand.bridge.drivers.sql).toHaveBeenCalledWith("${match[1]}", ${match[2]});\n`;
                    }
                    return;
                }

                code += `    ${trimmed};\n`;
            }
        });

        // Inject the collected mocks at the TOP of the test (via viand.use)
        if (Object.keys(sqlMocks).length > 0 || Object.keys(apiMocks).length > 0) {
            let useStr = `    if (window.viand) window.viand.use({\n`;
            if (Object.keys(sqlMocks).length > 0) {
                useStr += `      sql: (label, ...args) => {\n`;
                Object.entries(sqlMocks).forEach(([label, impl]) => {
                    useStr += `        if (label === '${label}') return (${impl})(...args);\n`;
                });
                useStr += `        return [];\n      },\n`;
            }
            useStr += `    });\n`;
            
            // Insert it after it declaration
            code = code.replace(`it('${t.type} verification', async () => {\n`, `it('${t.type} verification', async () => {\n${useStr}`);
        }

        code += `  });\n`;
    });

    code += `});\n`;
    return code;
}

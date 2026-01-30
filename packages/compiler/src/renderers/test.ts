import { ComponentManifest } from '../types.ts';

export function generateTests(manifest: ComponentManifest): string {
    let code = `import { describe, it, expect, beforeEach } from 'vitest';\n`;
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
        t.body.forEach(line => {
            if (typeof line === 'string') {
                if (line.includes('must find')) {
                    const match = line.match(/must find "([^"]+)" with text "([^"]+)"/);
                    if (match) {
                        code += `    expect(screen.getByText(/${match[2]}/i)).toBeTruthy();\n`;
                    }
                } else if (line.includes('set ')) {
                    const match = line.match(/set (.*) = (.*)/);
                    if (match) code += `    ${match[1]} = ${match[2]};\n`;
                } else {
                    code += `    ${line};\n`;
                }
            }
        });
        code += `  });\n`;
    });

    code += `});\n`;
    return code;
}

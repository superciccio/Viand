import { tokenize, analyzeHierarchy } from './lexer.ts';
import { buildManifest } from './parser.ts';
import { generateSvelte5 } from './renderers/svelte.ts';
import { generateLogicClass } from './renderers/logic.ts';
import { generateTests } from './renderers/test.ts';
import { generateStaticHTML } from './renderers/static.ts';
import { format } from './formatter.ts';

/**
 * Compiles Viand code to Svelte code.
 */
export function compile(code: string, sql: string = "", api: string = ""): string {
    const { tokens, lexerErrors } = tokenize(code);
    const tree = analyzeHierarchy(tokens);
    const { manifest } = buildManifest(tree, lexerErrors, sql, api);
    
    if (manifest.isMemory) {
        return generateLogicClass(manifest) + `\nexport default ${manifest.name};\n`;
    }

    return generateSvelte5(manifest);
}

/**
 * Full compilation process.
 */
export function processViand(code: string, sqlSource: string = "", apiSource: string = "", langSource: string = ""): { svelte: string, logic: string, tests: string, static: string, manifest: any, reports: string[] } {
    const { tokens, lexerErrors } = tokenize(code);
    const tree = analyzeHierarchy(tokens);
    const { manifest, reports } = buildManifest(tree, lexerErrors, sqlSource, apiSource, langSource);
    
    return {
        manifest,
        reports,
        svelte: generateSvelte5(manifest),
        logic: generateLogicClass(manifest),
        tests: generateTests(manifest),
        static: generateStaticHTML(manifest)
    };
}

export { 
    tokenize, 
    analyzeHierarchy, 
    buildManifest, 
    generateSvelte5, 
    generateLogicClass, 
    generateTests,
    generateStaticHTML,
    format
};
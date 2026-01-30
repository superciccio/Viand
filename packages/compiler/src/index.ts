import { tokenize, analyzeHierarchy } from './lexer.ts';
import { buildManifest } from './parser.ts';
import { generateTests } from './renderers/test.ts';
import { generateSignalsJS } from './renderers/signals.ts';
import { generateNitroHandler } from './renderers/nitro.ts';
import { generateSqlHandler } from './renderers/sql.ts';
import { format } from './formatter.ts';
import type { ComponentManifest } from './types.ts';

/**
 * Validates a manifest for language constraints.
 */
export function validateManifest(manifest: ComponentManifest, filePath: string): string[] {
    const errors: string[] = [];
    // Basic validation logic
    return errors;
}

/**
 * Full compilation process.
 */
export function processViand(code: string, sqlSource: string = "", apiSource: string = "", langSource: string = "", headSource: string = "", filePath: string = ""): { tests: string, signals: string, nitro: string, sql: string, manifest: any, reports: string[] } {
    const { tokens, lexerErrors } = tokenize(code);
    const tree = analyzeHierarchy(tokens);
    const { manifest, reports: parserReports } = buildManifest(tree, lexerErrors, sqlSource, apiSource, langSource, headSource);

    const validationErrors = validateManifest(manifest, filePath);
    const allReports = [...lexerErrors, ...parserReports, ...validationErrors];

    return {
        manifest,
        reports: allReports,
        tests: generateTests(manifest),
        signals: generateSignalsJS(manifest),
        nitro: generateNitroHandler(manifest),
        sql: generateSqlHandler(manifest)
    };
}

export {
    tokenize,
    analyzeHierarchy,
    buildManifest,
    generateTests,
    generateSignalsJS,
    generateNitroHandler,
    generateSqlHandler,
    format
};

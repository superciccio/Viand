import { tokenize, analyzeHierarchy } from '../src/lexer.ts';
import { buildManifest, generateTests } from '../src/transformer.ts';

function assert(condition: boolean, message: string) {
    if (!condition) {
        console.error(`❌ FAIL: ${message}`);
        process.exit(1);
    }
}

console.log("🧪 RUNNING COMPILER UNIT TESTS...");

// Test 1: Persona Parsing
const code = `
test App:
    @logic:
        must $count == 0
`;

const { tokens, lexerErrors } = tokenize(code);
const tree = analyzeHierarchy(tokens);
const { manifest } = buildManifest(tree, lexerErrors);

assert(manifest.tests.length === 1, "Should have 1 test suite");
assert(manifest.tests[0].type === 'logic', `Persona should be 'logic', got '${manifest.tests[0].type}'`);

// Test 2: Logic Translation
const generated = generateTests(manifest);
assert(generated.includes('const _ = new ComponentLogic()'), "Should use '_' as instance variable");
assert(generated.includes('expect(_.count == 0).toBeTruthy()'), "Should translate 'must $count' to expect(_.count)");

console.log("✅ ALL UNIT TESTS PASSED!");

import { format } from '../src/formatter.ts';

function assert(condition: boolean, message: string) {
    if (!condition) {
        console.error(`❌ FAIL: ${message}`);
        process.exit(1);
    }
}

console.log("🧪 RUNNING FORMATTER UNIT TESTS...");

// Test 1: Indentation Correction
const code1 = `
component App:
  view:
    div:
      p: "Hello"
`;
const formatted1 = format(code1);
assert(formatted1.includes('    view:'), "Should correct 2-space to 4-space indent");
assert(formatted1.includes('        div:'), "Should correct deep nested indent");

// Test 2: Arrow Spacing
const code2 = `button->click(): "Add"`;
const formatted2 = format(code2);
assert(formatted2.includes('button -> click(): "Add"'), "Should add spaces around arrow");

console.log("✅ ALL FORMATTER TESTS PASSED!");

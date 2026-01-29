import fs from 'fs';
import path from 'path';
import { tokenize, analyzeHierarchy } from '../src/lexer.js';
import { transform } from '../src/transformer.js';

const casesDir = './tests/cases';

fs.readdirSync(casesDir).forEach(file => {
    if (!file.endsWith('.viand')) return;

    console.log(`\n--- TESTING: ${file} ---`);
    const code = fs.readFileSync(path.join(casesDir, file), 'utf-8');

    try {
        const { tokens, lexerErrors } = tokenize(code);
        const tree = analyzeHierarchy(tokens);
        const output = transform(tree, lexerErrors);
        
        console.log(`✅ ${file} passed compilation.`);
        // Optional: Save output to a 'dist' folder for manual inspection
    } catch (e) {
        console.log(`❌ ${file} failed as expected (or due to error).`);
    }
});

function compileFile(filePath) {
    console.log(`\n--- Compiling: ${filePath} ---`);
    const code = fs.readFileSync(filePath, 'utf-8');
    
    const { tokens, lexerErrors } = tokenize(code);
    const tree = analyzeHierarchy(tokens);
    const svelte = transform(tree, lexerErrors);
    
    console.log(svelte);
}

// Run the Todo Scaffold
compileFile('./project-test/src/TodoItem.viand');
compileFile('./project-test/src/App.viand');
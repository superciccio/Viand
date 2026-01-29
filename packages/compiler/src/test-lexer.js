import { tokenize } from './lexer.js';
import { analyzeHierarchy } from './lexer.js'; 

const sampleCode = `
component Todo:
    $task = ""
    
    !add_item():
        @native::storage.save($task)

    view:
        div .container:
            h1: "Viand Todo"
`;

try {
    const rawTokens = tokenize(sampleCode);
    const tree = analyzeHierarchy(rawTokens);

    console.log("🌿 VIAND HIERARCHY MAP:");
    console.table(tree.map(t => ({
        line: t.line,
        depth: t.depth,
        type: t.type,
        content: t.content
    })));
} catch (err) {
    console.error(err.message);
}
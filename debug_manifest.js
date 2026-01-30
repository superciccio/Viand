import { tokenize, analyzeHierarchy, buildManifest } from './packages/compiler/src/index.ts';

const code = `
    canvas #chartEl:
`;

const { tokens, lexerErrors } = tokenize(code);
const tree = analyzeHierarchy(tokens);
const { manifest } = buildManifest(tree, lexerErrors);

console.log("TYPE:", manifest.view[0].type);
console.log("TAG:", manifest.view[0].tag);
console.log("REF:", manifest.view[0].ref);
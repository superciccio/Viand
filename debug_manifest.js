import { tokenize, analyzeHierarchy, buildManifest } from './packages/compiler/src/index.ts';

const code = `
    h1: intl.t('title')
`;

const { tokens, lexerErrors } = tokenize(code);
const tree = analyzeHierarchy(tokens);
const { manifest } = buildManifest(tree, lexerErrors);

console.log("TAG:", manifest.view[0].tag);
console.log("INLINE:", manifest.view[0].children[0].content);

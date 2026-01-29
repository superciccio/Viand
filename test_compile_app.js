import fs from 'fs';
import { compile } from './packages/compiler/src/index.ts';

const code = fs.readFileSync('project-test/src/App.viand', 'utf-8');
const sql = fs.readFileSync('project-test/src/App.sql', 'utf-8');
console.log("--- COMPILED SVELTE OUTPUT ---");
console.log(compile(code, sql));

#!/usr/bin/env node

console.log("🌿 Viand CLI v0.1.0");
const args = process.argv.slice(2);

if (args[0] === 'dev') {
    console.log("Watching for .viand files...");
    // Future: Start the watcher here
} else {
    console.log("Welcome to Viand. Try 'viand dev'");
}
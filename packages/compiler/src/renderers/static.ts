import { ComponentManifest } from '../types.ts';
import { generateSvelte5 } from './svelte.ts';

export function generateStaticHTML(manifest: ComponentManifest): string {
    // Basic Skeleton for Milestone 10
    // This will eventually use Svelte's server-side renderer.
    const svelteCode = generateSvelte5(manifest);
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>${manifest.name}</title>
</head>
<body>
    <div id="app">
        <!-- Static Content Placeholder -->
    </div>
</body>
</html>`;
}

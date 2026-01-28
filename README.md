Viand 🌿
Write once. Morph anywhere.

Viand (a play on Andrea and Via) is a high-level, indentation-based programming language that eliminates frontend boilerplate. It is a "parasitic" language that transpiles into highly optimized Svelte code, targeting Tauri for desktop and standard engines for the web.

✨ Why Viand?
Zero Noise: No curly braces, no semi-colons, no boilerplate imports. Just clean, Python-style indentation.

Implicit Reactivity: Use the $ prefix for state. No useState or complex hooks. Viand handles the reactivity mapping for you.

Platform-Aware (@platform): Use the same codebase for Web and Desktop. The compiler strips out unused platform code at build-time.

Namespace Navigation: Ditch manual imports. Use UI::Button or Todo::Item to automatically resolve components based on your folder structure.

Unified Storage: One syntax for data. Viand swaps drivers automatically between IndexedDB (Web) and SQLite/FileSystem (Host).

🚀 The Syntax at a Glance
Plaintext
component Counter:
    $count = 0

    fn increment():
        $count += 1

    view:
        div .card:
            h1: "Count is " + $count
            button .btn-primary "Add +1" -> increment()
            
            if @platform.is_mobile:
                p: "Tip: You can also shake your phone!"

🛠 Project Structure (Monorepo)
/packages/compiler: The core translation engine.

/packages/cli: The viand command-line tool.

/packages/stdlib: Cross-platform drivers and @platform logic.

/editors/vscode: Syntax highlighting and IntelliSense.

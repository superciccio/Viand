
/** @type {import('tailwindcss').Config} */
export default {
  content: {
    files: [
      "./index.html",
      "./src/**/*.{svelte,js,ts,viand}",
    ],
    transform: {
      viand: (content) => {
        // Find all .class-name occurrences in Viand files
        const matches = content.match(/\.([a-zA-Z0-9_-]+)/g) || [];
        return matches.map(m => m.slice(1));
      }
    }
  },
  theme: {
    extend: {},
  },
  plugins: [],
}

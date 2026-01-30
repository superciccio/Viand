import { defineConfig } from 'vite'
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import viand from '../packages/vite-plugin-viand/index.js'

export default defineConfig({
  resolve: {
    conditions: ['browser', 'development']
  },
  plugins: [
    viand(),
    svelte({
      preprocess: vitePreprocess(),
      extensions: ['.svelte', '.viand', '.svelte.ts', '.svelte.js']
    })
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts']
  }
})

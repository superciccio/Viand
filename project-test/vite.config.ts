import { defineConfig } from 'vite'
import { svelte, vitePreprocess } from '@sveltejs/vite-plugin-svelte'
import viand from '../packages/vite-plugin-viand/index.js'

export default defineConfig({
  plugins: [
    viand(),
    svelte({
      preprocess: vitePreprocess(),
      extensions: ['.svelte', '.viand']
    })
  ],
})

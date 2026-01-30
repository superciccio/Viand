import { defineConfig } from 'vite'
import viand from '../packages/vite-plugin-viand/index.ts'

export default defineConfig({
  resolve: {
    conditions: ['browser', 'development']
  },
  plugins: [
    viand()
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts']
  }
})
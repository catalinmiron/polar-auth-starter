import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    // Resolves the `@/*` path alias from tsconfig.json.
    tsconfigPaths: true,
  },
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), viteReact(), tailwindcss()],
})

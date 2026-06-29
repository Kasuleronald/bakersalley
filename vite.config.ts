import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@google/genai': path.resolve(__dirname, 'services/googleGenaiProxy.ts')
    }
  },
  base: '/bakersalley/',
})

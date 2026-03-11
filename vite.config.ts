import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5176,
    proxy: {
      '/api/catalog': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/generate': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/submissions': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/api/sdlc': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})

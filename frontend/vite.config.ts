import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In Docker, VITE_API_TARGET is set to http://api:8000
// Locally it defaults to http://localhost:8000
const apiTarget = process.env.VITE_API_TARGET ?? 'http://localhost:8000'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})

/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In Docker, VITE_API_TARGET is set to http://api:8000 (container port, not host).
// Locally it defaults to http://localhost:3500 — see docs/PORTS.md
const apiTarget = process.env.VITE_API_TARGET ?? 'http://localhost:3500'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
  },
  server: {
    host: '0.0.0.0',
    port: 3501,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
})

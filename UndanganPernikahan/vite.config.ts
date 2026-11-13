import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

// Saat `npm run dev` / `npm run preview`, permintaan /api diteruskan ke server (npm run dev:server).
const api = { '/api': { target: `http://localhost:${process.env.API_PORT || 3000}` } }

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  build: { sourcemap: false },
  server: { host: '0.0.0.0', port: 8443, proxy: api },
  preview: { host: '0.0.0.0', port: 8443, proxy: api },
})

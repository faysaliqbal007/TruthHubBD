import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/app/',
  build: { outDir: '../backend/public/app', emptyOutDir: true },
  define: {
    'process.env.NEXT_PUBLIC_API_URL': JSON.stringify(''),
    'process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY': JSON.stringify(''),
  },
  server: { proxy: { '/api': 'http://127.0.0.1:8000', '/sanctum': 'http://127.0.0.1:8000' } },
})

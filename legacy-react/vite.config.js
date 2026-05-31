import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Configuration Vite — app web unique (tablette/PC d'abord). On garde simple.
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' }
})

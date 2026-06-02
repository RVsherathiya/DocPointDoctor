import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/doctor/',
  build: {
    outDir: '../DocPointBackend/public/doctor',
    emptyOutDir: true,
  },
})

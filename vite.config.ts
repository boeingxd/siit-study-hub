import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Served from https://boeingxd.github.io/siit-study-hub/ — a subpath, not
  // the domain root — so every asset URL must be prefixed accordingly.
  base: '/siit-study-hub/',
  plugins: [react()],
})

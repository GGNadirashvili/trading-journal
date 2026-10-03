import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages serves a project site from /<repo>/. Local dev and previews stay at /.
  base: process.env.GITHUB_ACTIONS ? '/trading-journal/' : '/',
  plugins: [react(), tailwindcss()],
})

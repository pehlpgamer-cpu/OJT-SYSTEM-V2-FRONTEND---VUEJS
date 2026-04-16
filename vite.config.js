import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
  ],
  // Base URL configuration for Netlify deployment
  base: '/',
  build: {
    // Ensure dist directory is created and published
    outDir: 'dist',
    // Disable source maps in production for smaller bundle
    sourcemap: process.env.NODE_ENV !== 'production',
  },
  test: {
    environment: 'jsdom'
  }
})

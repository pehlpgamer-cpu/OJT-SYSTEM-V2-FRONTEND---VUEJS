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
    // Code splitting for faster initial load
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['vue', 'vue-router', 'pinia'],
          'ui': ['@headlessui/vue', 'lucide-vue-next'],
          'charts': ['chart.js', 'vue-chartjs'],
        },
        compact: true,
      }
    },
    // JavaScript minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
      },
    },
    // CSS minification and code splitting
    cssCodeSplit: true,
    // Warn on large chunks
    chunkSizeWarningLimit: 500,
  },
  test: {
    environment: 'jsdom',
    // Exclude E2E tests from unit test runs
    exclude: ['e2e/**', 'node_modules/**']
  }
})

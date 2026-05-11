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
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) {
              return 'vendor'
            }
            if (id.includes('@headlessui') || id.includes('lucide-vue-next')) {
              return 'ui'
            }
            if (id.includes('chart.js') || id.includes('vue-chartjs')) {
              return 'charts'
            }
          }
        }
      }
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

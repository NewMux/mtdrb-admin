import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { configDefaults } from 'vitest/config'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  build: {
    outDir: 'dist',
    // Do not publish original source content in production artifacts.
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          mui: ['@mui/material'],
          utils: ['date-fns', 'i18next', 'react-i18next'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 3000,
    host: true,
    // Allow the sandbox's proxied preview host without disabling Vite's
    // DNS-rebinding protection for arbitrary hostnames.
    allowedHosts: ['localhost', '127.0.0.1', '::1', '.manus.computer'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    // Claude Code worktrees hold full copies of the repo; don't run their tests twice.
    exclude: [...configDefaults.exclude, '.claude/**'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
      ],
    },
  },
}) 
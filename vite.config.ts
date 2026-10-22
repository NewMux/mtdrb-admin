import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react()],
  // Belt and braces next to the no-console lint rule: a production build drops
  // console.log/info/debug calls outright (warn/error stay, Sentry reads them).
  esbuild: mode === 'production' ? { pure: ['console.log', 'console.info', 'console.debug'] } : {},
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
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
      ],
    },
  },
}))

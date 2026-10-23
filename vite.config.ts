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
        // Stable libraries get their own files so a returning visitor keeps them
        // cached across deploys and only re-downloads the app's own (small) code.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(react|react-dom|react-router|react-router-dom|scheduler)\//.test(id)) return 'vendor';
          if (/node_modules\/@supabase\//.test(id)) return 'supabase';
          if (/node_modules\/(i18next|react-i18next|html-parse-stringify|void-elements)\//.test(id)) return 'i18n';
          return undefined;
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
    // Browser specs under e2e/ belong to Playwright (`npm run e2e`).
    exclude: ['node_modules/', 'dist/', 'e2e/'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
      ],
    },
  },
}))

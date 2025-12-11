import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React and React DOM - keep in main bundle or ensure it loads first
            // Don't split React as it's needed by all chunks
            if (id.includes('react') || id.includes('react-dom')) {
              // Keep React in the main bundle to avoid loading order issues
              return undefined;
            }
            // React Router
            if (id.includes('react-router')) {
              return 'vendor-router';
            }
            // React Query
            if (id.includes('@tanstack/react-query')) {
              return 'vendor-query';
            }
            // UI libraries
            if (id.includes('lucide-react') || id.includes('react-hot-toast')) {
              return 'vendor-ui';
            }
            // Date libraries
            if (id.includes('date-fns')) {
              return 'vendor-date';
            }
            // Zustand (state management)
            if (id.includes('zustand')) {
              return 'vendor-state';
            }
            // Axios
            if (id.includes('axios')) {
              return 'vendor-http';
            }
            // Socket.io
            if (id.includes('socket.io')) {
              return 'vendor-socket';
            }
            // Other vendors
            return 'vendor-other';
          }
          // Page chunks (already handled by lazy loading)
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },
    chunkSizeWarningLimit: 1000,
    // Performance optimizations
    target: 'esnext',
    cssCodeSplit: true,
    // Tree shaking
    treeshake: {
      moduleSideEffects: false,
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.ts',
  },
})


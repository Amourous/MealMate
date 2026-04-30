import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
              return 'vendor';
            }
            if (id.includes('sortablejs') || id.includes('i18next') || id.includes('react-i18next')) {
              return 'utils';
            }
            if (id.includes('@supabase')) {
              return 'db';
            }
          }
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.js',
  },
});

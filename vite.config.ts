import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    port: 5173,
    host: '127.0.0.1',
    open: true,
    strictPort: true,
    headers: {
      'Cache-Control': 'no-store',
    },
  },
  build: {
    chunkSizeWarningLimit: 1600,
  },
  optimizeDeps: {
    exclude: ['phaser'],
  },
});

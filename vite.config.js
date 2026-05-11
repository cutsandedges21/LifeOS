import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    host: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-dom/client', 'framer-motion'],
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});

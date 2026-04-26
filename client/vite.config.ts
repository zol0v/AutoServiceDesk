import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setupTests.ts',
    css: true,
    testTimeout: 15000,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5263',
    },
  },
});
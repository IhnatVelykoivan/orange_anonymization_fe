import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import tailwindcss from '@tailwindcss/vite';
import svgr from 'vite-plugin-svgr';
import istanbul from 'vite-plugin-istanbul';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    svgr(),
    istanbul({
      include: 'src/**/*.{ts,tsx}',
      exclude: ['node_modules', 'src/test/**', 'src/**/*.test.*', 'src/**/*.d.ts'],
      requireEnv: true,
      forceBuildInstrument: false,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
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
});

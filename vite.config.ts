import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { ViteAliases } from 'vite-aliases';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ViteAliases({
      deep: false,
      silent: false,
      depth: 0,
    }),
  ],
});

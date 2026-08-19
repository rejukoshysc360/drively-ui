import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  optimizeDeps: {
    include: ['frappe-gantt', 'frappe-gantt-react'],
  },
  build: {
    outDir: 'dist',
    commonjsOptions: {
      include: [/node_modules/],
      // ✅ ensure transformation of mixed modules
      transformMixedEsModules: true,
    },
    rollupOptions: {
      // optionally specify externals etc.
    },
  }
});

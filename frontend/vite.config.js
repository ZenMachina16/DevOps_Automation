import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 2000,
    strictPort: true,

    // 👇 ADD THIS
    allowedHosts: [
      'b749679e0c7a.ngrok-free.app',
    ],

    proxy: {
      '/api': {
        target: 'http://localhost:7000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:7000',
        changeOrigin: true,
      },
    },
  },
});

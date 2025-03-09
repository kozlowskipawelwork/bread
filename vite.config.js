import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist', // Ensure built files go to 'dist'
    assetsDir: 'assets', // Ensures assets are in the right place
  },
  server: {
    headers: {
      'Content-Type': 'application/javascript',
    },
  },
});

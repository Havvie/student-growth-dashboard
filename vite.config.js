import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' makes the build work from any sub-path (GitHub Pages project sites, Vercel, Netlify).
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { chunkSizeWarningLimit: 700 },
});

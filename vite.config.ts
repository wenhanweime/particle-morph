import { defineConfig } from 'vite';

// Default `/` for local + Vercel. GitHub Pages workflow sets BASE_PATH=/particle-morph/
const base = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base,
});

import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    global: 'globalThis',
  },
  build: {
    sourcemap: false,
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          motion: ['motion'],
          network: ['axios'],
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Pré-bundler dès le démarrage les dépendances utilisées par les pages
  // chargées en lazy (routes admin/educator/player/parent...). Sans ça, Vite
  // ne les découvre qu'à la navigation vers la première route qui les importe,
  // et doit relancer une passe d'optimisation + recharger la page à ce
  // moment-là (autre source de page blanche/rechargement en boucle en dev).
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'motion/react',
      'recharts',
      'lucide-react',
      'sonner',
      'date-fns',
    ],
  },
  server: {
    port: 3000,
    // Ne pas ouvrir automatiquement le navigateur au démarrage : sur un cold start
    // (cache .vite/deps vidé), Vite doit d'abord pré-bundler les dépendances avec
    // esbuild. Ouvrir l'onglet trop tôt le fait charger la page pendant ce
    // pré-bundling, ce qui se traduit par une page blanche qui reste en
    // "Chargement en cours" jusqu'à ce que l'optimisation se termine.
    // On ouvre nous-mêmes l'onglet une fois que le terminal affiche "ready".
    open: true,
  },
});

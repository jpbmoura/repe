import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  envDir: path.resolve(__dirname, '../..'),
  plugins: [
    TanStackRouterVite({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: 'src/routes',
      generatedRouteTree: 'src/routeTree.gen.ts',
    }),
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: [
        'favicon.svg',
        'icons/*.svg',
        'icons/*.png',
        'logos/*.svg',
      ],
      manifest: {
        name: 'Repê',
        short_name: 'Repê',
        description: 'Treino, série por série',
        theme_color: '#0B0B0C',
        background_color: '#0B0B0C',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'pt-BR',
        start_url: '/',
        icons: [
          {
            src: '/icons/repe-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/icons/repe-icon-maskable.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@repe/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@repe/ui': path.resolve(__dirname, '../../packages/ui/src'),
    },
  },
  server: {
    port: 5173,
    host: true,
  },
});

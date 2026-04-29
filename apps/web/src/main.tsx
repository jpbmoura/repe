import { QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { UpdatePrompt } from './components/update-prompt';
import { queryClient } from './lib/query-client';
import { routeTree } from './routeTree.gen';
import './styles/tokens.css';

const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  context: {
    queryClient,
    user: undefined,
  },
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <UpdatePrompt />
    </QueryClientProvider>
  </StrictMode>,
);

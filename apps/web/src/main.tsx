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
  defaultViewTransition: true,
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

// Remove splash quando React montar a primeira tela.
function dismissSplash() {
  document.body.classList.add('app-mounted');
  setTimeout(() => {
    document.body.classList.add('app-splash-done');
  }, 350);
}

if (document.readyState === 'complete') {
  requestAnimationFrame(() => requestAnimationFrame(dismissSplash));
} else {
  window.addEventListener(
    'load',
    () => requestAnimationFrame(() => requestAnimationFrame(dismissSplash)),
    { once: true },
  );
}

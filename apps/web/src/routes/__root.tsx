import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';

interface RouterContext {
  queryClient: QueryClient;
  user: { id: string; role: string } | undefined;
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootComponent,
});

function RootComponent() {
  return (
    <div className="min-h-dvh bg-bg-base text-text-primary">
      <Outlet />
    </div>
  );
}

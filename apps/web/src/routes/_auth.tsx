import { OnlineBanner } from '@/components/online-banner';
import { authClient } from '@/lib/auth-client';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ location }) => {
    const { data: session } = await authClient.getSession();
    if (!session?.user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }
    return {
      user: {
        id: session.user.id,
        role: (session.user as { role?: string }).role ?? 'personal',
        nome: (session.user as { nome?: string }).nome ?? session.user.name,
        email: session.user.email,
      },
    };
  },
  component: AuthLayout,
});

function AuthLayout() {
  return (
    <>
      <OnlineBanner />
      <Outlet />
    </>
  );
}

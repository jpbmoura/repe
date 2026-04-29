import { BottomNav } from '@/components/bottom-nav';
import { OnlineBanner } from '@/components/online-banner';
import { ensureSession } from '@/lib/session';
import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth')({
  beforeLoad: async ({ location }) => {
    const session = await ensureSession();
    if (!session?.user) {
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      });
    }
    const role: 'aluno' | 'personal' =
      (session.user as { role?: string }).role === 'aluno' ? 'aluno' : 'personal';
    return {
      user: {
        id: session.user.id,
        role,
        nome: (session.user as { nome?: string }).nome ?? session.user.name,
        email: session.user.email,
      },
    };
  },
  component: AuthLayout,
});

function AuthLayout() {
  const { user } = Route.useRouteContext();
  return (
    <>
      <OnlineBanner />
      <Outlet />
      <BottomNav role={user.role} />
    </>
  );
}

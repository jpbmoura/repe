import { createFileRoute, redirect } from '@tanstack/react-router';
import { authClient } from '@/lib/auth-client';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const { data: session } = await authClient.getSession();
    if (!session?.user) {
      throw redirect({ to: '/login' });
    }
    const role = (session.user as { role?: string }).role;
    if (role === 'aluno') {
      throw redirect({ to: '/hoje' });
    }
    throw redirect({ to: '/alunos' });
  },
});

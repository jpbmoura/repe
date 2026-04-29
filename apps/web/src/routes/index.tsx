import { ensureSession } from '@/lib/session';
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    const session = await ensureSession();
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

import { authClient } from '@/lib/auth-client';
import { ensureSession, invalidateSession } from '@/lib/session';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@repe/shared/schemas';
import { Logo } from '@repe/ui';
import { createFileRoute, Link, redirect, useNavigate } from '@tanstack/react-router';
import { forwardRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const searchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute('/login')({
  validateSearch: searchSchema,
  beforeLoad: async () => {
    const session = await ensureSession();
    if (session?.user) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginInput) => {
    setServerError(null);
    setSubmitting(true);
    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });
    setSubmitting(false);

    if (error) {
      setServerError(error.message ?? 'Não foi possível entrar. Confira e-mail e senha.');
      return;
    }

    await invalidateSession();
    navigate({ to: search.redirect ?? '/', replace: true });
  };

  return (
    <main className="mx-auto flex min-h-safe max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8">
        <Logo variant="dark" className="mb-4 h-10" />
        <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo de volta</h1>
        <p className="text-text-secondary mt-1 text-sm">Entre com seu e-mail e senha.</p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Field
          label="E-mail"
          type="email"
          autoComplete="email"
          {...form.register('email')}
          error={form.formState.errors.email?.message}
        />
        <Field
          label="Senha"
          type="password"
          autoComplete="current-password"
          {...form.register('password')}
          error={form.formState.errors.password?.message}
        />

        {serverError && (
          <p className="text-danger text-sm" role="alert">
            {serverError}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="bg-accent text-bg-base hover:bg-accent-hover active:bg-accent-pressed disabled:opacity-60 mt-2 w-full rounded-pill py-3 font-medium transition"
        >
          {submitting ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="text-text-secondary mt-8 text-center text-sm">
        Ainda não tem conta?{' '}
        <Link to="/cadastro" className="text-accent">
          Cadastrar
        </Link>
      </p>
    </main>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, ...props }, ref) => {
    return (
      <label className="block">
        <span className="text-text-secondary mb-1.5 block text-sm">{label}</span>
        <input
          ref={ref}
          {...props}
          className="bg-bg-subtle border-border focus:border-accent w-full rounded-chip border px-4 py-3 outline-none transition"
        />
        {error && <span className="text-danger mt-1 block text-xs">{error}</span>}
      </label>
    );
  },
);
Field.displayName = 'Field';

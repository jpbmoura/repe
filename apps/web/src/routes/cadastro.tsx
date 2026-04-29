import { api, ApiError } from '@/lib/api';
import { ensureSession, invalidateSession } from '@/lib/session';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  cadastroAlunoSchema,
  cadastroPersonalSchema,
  type CadastroAlunoInput,
  type CadastroPersonalInput,
} from '@repe/shared/schemas';
import { Logo } from '@repe/ui';
import {
  createFileRoute,
  Link,
  redirect,
  useNavigate,
} from '@tanstack/react-router';
import { ChevronLeft } from 'lucide-react';
import { forwardRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

const searchSchema = z.object({
  codigo: z.string().optional(),
  role: z.enum(['personal', 'aluno']).optional(),
});

export const Route = createFileRoute('/cadastro')({
  validateSearch: searchSchema,
  beforeLoad: async ({ search }) => {
    const session = await ensureSession();
    if (session?.user) {
      throw redirect({ to: '/' });
    }
    // Sem nenhum contexto: força usuário a escolher o role primeiro.
    if (!search.role && !search.codigo) {
      throw redirect({ to: '/' });
    }
  },
  component: CadastroPage,
});

function CadastroPage() {
  const search = Route.useSearch();
  // Aluno se: tem código pré-preenchido OU role=aluno explícito.
  const isAluno = Boolean(search.codigo) || search.role === 'aluno';
  const backTo = isAluno ? '/login' : '/login';
  const backSearch = isAluno
    ? { role: 'aluno' as const }
    : { role: 'personal' as const };

  return (
    <main className="mx-auto flex min-h-safe max-w-md flex-col justify-center px-6 py-12">
      <div className="mb-8">
        <Link
          to={backTo}
          search={backSearch}
          className="text-text-secondary hover:text-text-primary mb-6 inline-flex items-center gap-1 text-sm"
        >
          <ChevronLeft size={16} />
          Voltar
        </Link>
        <Logo variant="dark" className="mb-4 h-10" />
        <h1 className="text-2xl font-semibold tracking-tight">
          {isAluno ? 'Cadastro de aluno' : 'Cadastro de personal'}
        </h1>
        <p className="text-text-secondary mt-1 text-sm">
          {isAluno
            ? 'Use o código que seu personal compartilhou pra criar sua conta.'
            : 'Crie sua conta para começar a montar protocolos.'}
        </p>
      </div>

      {isAluno ? (
        <CadastroAlunoForm codigoInicial={search.codigo ?? ''} />
      ) : (
        <CadastroPersonalForm />
      )}

      <p className="text-text-secondary mt-8 text-center text-sm">
        Já tem conta?{' '}
        <Link to="/login" search={backSearch} className="text-accent">
          Entrar
        </Link>
      </p>
    </main>
  );
}

function CadastroPersonalForm() {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<CadastroPersonalInput>({
    resolver: zodResolver(cadastroPersonalSchema),
    defaultValues: { nome: '', email: '', password: '' },
  });

  const onSubmit = async (values: CadastroPersonalInput) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await api.post('/api/cadastro/personal', values);
      await invalidateSession();
      navigate({ to: '/alunos', replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(traduzirErro(err.code));
      } else {
        setServerError('Erro inesperado. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Field
        label="Nome"
        autoComplete="name"
        {...form.register('nome')}
        error={form.formState.errors.nome?.message}
      />
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
        autoComplete="new-password"
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
        className="bg-accent text-bg-base hover:bg-accent-hover active:bg-accent-pressed active:scale-[0.98] disabled:opacity-60 mt-2 w-full rounded-pill py-3 font-medium transition"
      >
        {submitting ? 'Criando…' : 'Criar conta'}
      </button>
    </form>
  );
}

function CadastroAlunoForm({ codigoInicial }: { codigoInicial: string }) {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const codigoPreenchido = codigoInicial.length > 0;

  const form = useForm<CadastroAlunoInput>({
    resolver: zodResolver(cadastroAlunoSchema),
    defaultValues: {
      nome: '',
      email: '',
      password: '',
      codigo: codigoInicial.toUpperCase(),
    },
  });

  const onSubmit = async (values: CadastroAlunoInput) => {
    setServerError(null);
    setSubmitting(true);
    try {
      await api.post('/api/cadastro/aluno', {
        ...values,
        codigo: values.codigo.toUpperCase(),
      });
      await invalidateSession();
      navigate({ to: '/hoje', replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setServerError(traduzirErro(err.code));
      } else {
        setServerError('Erro inesperado. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Field
        label="Código do convite"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        maxLength={8}
        placeholder="ABC12345"
        readOnly={codigoPreenchido}
        {...form.register('codigo', {
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
            e.target.value = e.target.value.toUpperCase();
          },
        })}
        className="font-num text-base tracking-widest uppercase"
        error={form.formState.errors.codigo?.message}
      />
      <Field
        label="Nome"
        autoComplete="name"
        {...form.register('nome')}
        error={form.formState.errors.nome?.message}
      />
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
        autoComplete="new-password"
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
        className="bg-accent text-bg-base hover:bg-accent-hover active:bg-accent-pressed active:scale-[0.98] disabled:opacity-60 mt-2 w-full rounded-pill py-3 font-medium transition"
      >
        {submitting ? 'Criando…' : 'Criar conta'}
      </button>
    </form>
  );
}

type FieldProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

const Field = forwardRef<HTMLInputElement, FieldProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <label className="block">
        <span className="text-text-secondary mb-1.5 block text-sm">{label}</span>
        <input
          ref={ref}
          {...props}
          className={`bg-bg-subtle border-border focus:border-accent w-full rounded-chip border px-4 py-3 outline-none transition ${className}`}
        />
        {error && <span className="text-danger mt-1 block text-xs">{error}</span>}
      </label>
    );
  },
);
Field.displayName = 'Field';

function traduzirErro(code: string): string {
  switch (code) {
    case 'codigo_invalido':
      return 'Código inválido ou expirado. Peça um novo ao seu personal.';
    case 'aluno_ja_cadastrado':
      return 'Esse convite já foi usado.';
    case 'USER_ALREADY_EXISTS':
    case 'user_already_exists':
      return 'Já existe uma conta com esse e-mail.';
    case 'validation_error':
      return 'Confira os campos.';
    default:
      return 'Não foi possível concluir o cadastro. Tente novamente.';
  }
}

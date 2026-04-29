import { cn } from '@repe/ui';
import { Link, useLocation } from '@tanstack/react-router';
import {
  BarChart3,
  CalendarDays,
  Clock,
  Library,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';

type Item = {
  to: string;
  label: string;
  icon: LucideIcon;
  matchPrefix?: string;
};

const ITEMS_PERSONAL: Item[] = [
  { to: '/alunos', label: 'Alunos', icon: Users, matchPrefix: '/alunos' },
  {
    to: '/biblioteca',
    label: 'Biblioteca',
    icon: Library,
    matchPrefix: '/biblioteca',
  },
  {
    to: '/metricas',
    label: 'Métricas',
    icon: BarChart3,
    matchPrefix: '/metricas',
  },
  { to: '/perfil', label: 'Perfil', icon: User, matchPrefix: '/perfil' },
];

const ITEMS_ALUNO: Item[] = [
  {
    to: '/hoje',
    label: 'Hoje',
    icon: CalendarDays,
    matchPrefix: '/hoje',
  },
  {
    to: '/historico',
    label: 'Histórico',
    icon: Clock,
    matchPrefix: '/historico',
  },
  {
    to: '/metricas',
    label: 'Métricas',
    icon: BarChart3,
    matchPrefix: '/metricas',
  },
  { to: '/perfil', label: 'Perfil', icon: User, matchPrefix: '/perfil' },
];

type Props = {
  role: 'personal' | 'aluno';
};

export function BottomNav({ role }: Props) {
  const items = role === 'personal' ? ITEMS_PERSONAL : ITEMS_ALUNO;
  const location = useLocation();

  return (
    <nav
      className="bg-bg-base/80 border-border fixed inset-x-0 bottom-0 z-30 border-t backdrop-blur-md"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <ul className="mx-auto flex max-w-2xl">
        {items.map((item) => {
          const Icon = item.icon;
          const ativo = item.matchPrefix
            ? location.pathname.startsWith(item.matchPrefix)
            : location.pathname === item.to;
          return (
            <li key={item.to} className="flex-1">
              <Link
                to={item.to}
                className={cn(
                  'flex h-16 flex-col items-center justify-center gap-1 transition active:scale-[0.92]',
                  ativo
                    ? 'text-accent'
                    : 'text-text-tertiary hover:text-text-secondary',
                )}
              >
                <Icon
                  size={20}
                  strokeWidth={ativo ? 2.4 : 2}
                  aria-hidden
                />
                <span
                  className={cn(
                    'text-[10px] font-medium',
                    ativo && 'font-semibold',
                  )}
                >
                  {item.label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

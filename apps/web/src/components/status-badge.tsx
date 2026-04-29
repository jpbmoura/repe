import { cn } from '@repe/ui';

export type StatusKind =
  | 'treinou'
  | 'treinando'
  | 'atraso'
  | 'pendente'
  | 'inativo'
  | 'rascunho'
  | 'ativo'
  | 'arquivado';

const MAP: Record<
  StatusKind,
  { label: string; className: string }
> = {
  treinou: { label: 'Treinou', className: 'bg-success/15 text-success' },
  treinando: { label: 'Treinando', className: 'bg-accent/15 text-accent' },
  atraso: { label: 'Atraso', className: 'bg-warn/15 text-warn' },
  pendente: {
    label: 'Aguardando',
    className: 'bg-bg-subtle text-text-secondary',
  },
  inativo: { label: 'Inativo', className: 'bg-bg-subtle text-text-tertiary' },
  rascunho: { label: 'Rascunho', className: 'bg-warn/15 text-warn' },
  ativo: { label: 'Ativo', className: 'bg-success/15 text-success' },
  arquivado: {
    label: 'Arquivado',
    className: 'bg-bg-subtle text-text-tertiary',
  },
};

type Props = {
  status: StatusKind;
  size?: 'sm' | 'md';
  className?: string;
};

export function StatusBadge({ status, size = 'md', className }: Props) {
  const { label, className: kindClass } = MAP[status];
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-pill font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs',
        kindClass,
        className,
      )}
    >
      {label}
    </span>
  );
}

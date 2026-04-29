import type { Equipamento } from '@repe/shared/schemas';
import {
  ArrowLeftRight,
  Cable,
  CircleDashed,
  Dumbbell,
  type LucideIcon,
  Weight,
  PersonStanding,
  Cog,
  Wrench,
} from 'lucide-react';

const MAP: Record<Equipamento, LucideIcon> = {
  barra: Dumbbell,
  halter: Weight,
  maquina: Cog,
  peso_corporal: PersonStanding,
  cabo: Cable,
  kettlebell: CircleDashed,
  anilha: Weight,
  outro: Wrench,
};

type Props = {
  equipamento: Equipamento;
  className?: string;
  size?: number;
};

export function ExercicioIcone({ equipamento, className, size = 18 }: Props) {
  const Icon = MAP[equipamento] ?? ArrowLeftRight;
  return <Icon size={size} className={className} aria-hidden />;
}

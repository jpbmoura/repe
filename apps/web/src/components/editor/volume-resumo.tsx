import { GRUPO_LABELS } from '@/lib/api/exercicios';
import {
  protocolosKeys,
  volumeApi,
  type VolumeResponse,
} from '@/lib/api/protocolos';
import type { GrupoMuscular } from '@repe/shared/schemas';
import { useQuery } from '@tanstack/react-query';

type Props = {
  protocoloId: string;
};

const cores = {
  baixo: 'bg-warn',
  ideal: 'bg-success',
  alto: 'bg-warn',
} as const;

export function VolumeResumo({ protocoloId }: Props) {
  const { data } = useQuery({
    queryKey: protocolosKeys.volume(protocoloId),
    queryFn: () => volumeApi.doProtocolo(protocoloId),
  });

  if (!data) return null;

  const max = Math.max(20, ...data.porGrupo.map((g) => g.series));

  return (
    <section className="bg-bg-elevated border-border rounded-card border p-4">
      <h3 className="mb-3 font-medium">Volume semanal</h3>
      {data.porGrupo.length === 0 && (
        <p className="text-text-secondary text-sm">
          Adicione exercícios para ver o volume.
        </p>
      )}
      {data.porGrupo.length > 0 && (
        <ul className="space-y-2">
          {data.porGrupo
            .slice()
            .sort((a, b) => b.series - a.series)
            .map((g) => (
              <li key={g.grupo}>
                <div className="mb-0.5 flex items-baseline justify-between text-sm">
                  <span>{GRUPO_LABELS[g.grupo as GrupoMuscular] ?? g.grupo}</span>
                  <span className="font-num text-text-secondary text-xs">
                    {g.series} séries
                  </span>
                </div>
                <div className="bg-bg-subtle relative h-2 overflow-hidden rounded-full">
                  <div className="bg-success/20 absolute inset-y-0 left-[50%] right-0 -translate-x-[calc(50%-50%)]" />
                  <div
                    className={`relative h-full ${cores[g.classificacao]}`}
                    style={{ width: `${Math.min(100, (g.series / max) * 100)}%` }}
                  />
                </div>
              </li>
            ))}
        </ul>
      )}

      {data.porTreino.length > 0 && (
        <div className="border-border mt-4 border-t pt-3">
          <h4 className="text-text-secondary mb-2 text-xs font-medium uppercase tracking-wide">
            Por treino
          </h4>
          <ul className="space-y-1.5">
            {data.porTreino.map((t) => (
              <li
                key={t.treinoId}
                className="flex items-baseline justify-between text-sm"
              >
                <span>
                  <span className="text-text-secondary mr-1.5">{t.letra}.</span>
                  {t.nome}
                </span>
                <span className="font-num text-text-secondary text-xs">
                  {t.totalSeries}s · {Math.round(t.tempoEstimadoSeg / 60)}min
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

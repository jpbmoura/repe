export type ExercicioComGrupo = {
  series: number;
  grupoMuscularPrimario: string;
  categoria: 'composto' | 'isolado';
  descansoSegundos: number;
};

export type TreinoVolume = {
  diasSemana: number[];
  exercicios: ExercicioComGrupo[];
};

const TEMPO_COMPOSTO = 30;
const TEMPO_ISOLADO = 25;
const FATOR_TRANSICAO = 1.1;

export function tempoEstimadoTreino(treino: TreinoVolume): number {
  const totalExecucao = treino.exercicios.reduce(
    (acc, e) => acc + e.series * (e.categoria === 'composto' ? TEMPO_COMPOSTO : TEMPO_ISOLADO),
    0,
  );
  const totalDescanso = treino.exercicios.reduce(
    (acc, e) => acc + e.descansoSegundos * Math.max(0, e.series - 1),
    0,
  );
  return Math.round((totalExecucao + totalDescanso) * FATOR_TRANSICAO);
}

export function totalSeriesTreino(treino: TreinoVolume): number {
  return treino.exercicios.reduce((acc, e) => acc + e.series, 0);
}

export function volumeSemanal(treinos: TreinoVolume[]): Record<string, number> {
  const acc: Record<string, number> = {};
  for (const treino of treinos) {
    const vezesNaSemana = treino.diasSemana.length;
    for (const ex of treino.exercicios) {
      acc[ex.grupoMuscularPrimario] =
        (acc[ex.grupoMuscularPrimario] ?? 0) + ex.series * vezesNaSemana;
    }
  }
  return acc;
}

export function classificarVolume(series: number): 'baixo' | 'ideal' | 'alto' {
  if (series < 10) return 'baixo';
  if (series <= 20) return 'ideal';
  return 'alto';
}

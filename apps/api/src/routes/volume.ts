import { db } from '@repe/db';
import { exerciciosTreino, protocolos, treinosProtocolo } from '@repe/db/schema';
import {
  classificarVolume,
  tempoEstimadoTreino,
  totalSeriesTreino,
  volumeSemanal,
} from '@repe/shared';
import { asc, eq } from 'drizzle-orm';
import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler.js';
import { protocoloDoPersonal } from '../lib/ownership.js';
import { paramStr } from '../lib/req.js';
import { personalOnly } from '../middleware/auth.js';

export const volumeRouter: Router = Router();

volumeRouter.get(
  '/protocolos/:id/volume',
  ...personalOnly,
  asyncHandler(async (req, res) => {
    const personalId = req.user!.id;
    const id = paramStr(req, 'id');

    const owned = await protocoloDoPersonal(id, personalId);
    if (!owned) {
      res.status(404).json({ error: 'protocolo_nao_encontrado' });
      return;
    }

    const protocolo = await db.query.protocolos.findFirst({
      where: eq(protocolos.id, id),
      with: {
        treinos: {
          orderBy: [asc(treinosProtocolo.ordem)],
          with: {
            exercicios: {
              orderBy: [asc(exerciciosTreino.ordem)],
              with: { exercicio: true },
            },
          },
        },
      },
    });

    if (!protocolo) {
      res.status(404).json({ error: 'protocolo_nao_encontrado' });
      return;
    }

    const treinosVolume = protocolo.treinos.map((t) => ({
      diasSemana: t.diasSemana,
      exercicios: t.exercicios.map((ex) => ({
        series: ex.series,
        grupoMuscularPrimario: ex.exercicio.grupoMuscularPrimario,
        categoria: ex.exercicio.categoria,
        descansoSegundos: ex.descansoSegundos,
      })),
    }));

    const semanal = volumeSemanal(treinosVolume);
    const porGrupo = Object.entries(semanal).map(([grupo, series]) => ({
      grupo,
      series,
      classificacao: classificarVolume(series),
    }));

    const porTreino = protocolo.treinos.map((t, i) => ({
      treinoId: t.id,
      letra: t.letra,
      nome: t.nome,
      tempoEstimadoSeg: tempoEstimadoTreino(treinosVolume[i]!),
      totalSeries: totalSeriesTreino(treinosVolume[i]!),
    }));

    res.json({ porGrupo, porTreino });
  }),
);

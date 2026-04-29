import { db } from '@repe/db';
import {
  alunos,
  exerciciosTreino,
  protocolos,
  seriesExecutadas,
  sessoesExecutadas,
  treinosProtocolo,
} from '@repe/db/schema';
import {
  serieAtualizarSchema,
  serieRegistrarSchema,
  sessaoFinalizarSchema,
  sessaoIniciarSchema,
  sessoesQuerySchema,
} from '@repe/shared/schemas';
import { and, asc, desc, eq, isNull, sql } from 'drizzle-orm';
import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler.js';
import { paramStr } from '../lib/req.js';
import { requireAuth } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';

export const sessoesRouter: Router = Router();

sessoesRouter.use(requireAuth);

async function alunoDoUsuario(userId: string) {
  return db.query.alunos.findFirst({
    where: eq(alunos.userId, userId),
  });
}

async function alunoAcessivelPeloUsuario(alunoId: string, userId: string, role: string) {
  if (role === 'aluno') {
    const aluno = await db.query.alunos.findFirst({
      where: and(eq(alunos.id, alunoId), eq(alunos.userId, userId)),
    });
    return aluno ?? null;
  }
  if (role === 'personal') {
    const aluno = await db.query.alunos.findFirst({
      where: and(eq(alunos.id, alunoId), eq(alunos.personalId, userId)),
    });
    return aluno ?? null;
  }
  return null;
}

sessoesRouter.get(
  '/aluno/hoje',
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const role = (user as { role?: string }).role;
    if (role !== 'aluno') {
      res.status(403).json({ error: 'apenas_aluno' });
      return;
    }

    const aluno = await alunoDoUsuario(user.id);
    if (!aluno) {
      res.status(404).json({ error: 'aluno_nao_encontrado' });
      return;
    }

    const protocoloAtivo = await db.query.protocolos.findFirst({
      where: and(eq(protocolos.alunoId, aluno.id), eq(protocolos.status, 'ativo')),
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

    if (!protocoloAtivo) {
      res.json({ aluno, protocolo: null, treino: null });
      return;
    }

    const hoje = new Date().getDay();
    const treinoDoDia = protocoloAtivo.treinos.find((t) =>
      t.diasSemana.includes(hoje),
    );

    if (!treinoDoDia) {
      res.json({ aluno, protocolo: protocoloAtivo, treino: null });
      return;
    }

    const exTreinoIds = treinoDoDia.exercicios.map((e) => e.id);
    const ultimasCargas = new Map<string, { cargaKg: string; repsFeitas: number }>();

    if (exTreinoIds.length > 0) {
      for (const exTreinoId of exTreinoIds) {
        const ultima = await db
          .select({
            cargaKg: seriesExecutadas.cargaKg,
            repsFeitas: seriesExecutadas.repsFeitas,
          })
          .from(seriesExecutadas)
          .innerJoin(
            sessoesExecutadas,
            eq(sessoesExecutadas.id, seriesExecutadas.sessaoId),
          )
          .where(
            and(
              eq(seriesExecutadas.exercicioTreinoId, exTreinoId),
              eq(sessoesExecutadas.alunoId, aluno.id),
            ),
          )
          .orderBy(desc(seriesExecutadas.concluidoEm))
          .limit(1);
        if (ultima[0]) ultimasCargas.set(exTreinoId, ultima[0]);
      }
    }

    const exerciciosComUltima = treinoDoDia.exercicios.map((ex) => ({
      ...ex,
      ultimaExecucao: ultimasCargas.get(ex.id) ?? null,
    }));

    const hojeStr = new Date().toISOString().slice(0, 10);
    const sessaoAtiva = await db.query.sessoesExecutadas.findFirst({
      where: and(
        eq(sessoesExecutadas.alunoId, aluno.id),
        eq(sessoesExecutadas.treinoId, treinoDoDia.id),
        eq(sessoesExecutadas.data, hojeStr),
        isNull(sessoesExecutadas.horaFim),
      ),
      orderBy: [desc(sessoesExecutadas.horaInicio)],
    });

    res.json({
      aluno,
      protocolo: { id: protocoloAtivo.id, nome: protocoloAtivo.nome },
      treino: { ...treinoDoDia, exercicios: exerciciosComUltima },
      sessaoAtiva: sessaoAtiva ?? null,
    });
  }),
);

sessoesRouter.get(
  '/sessoes/:id',
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const role = (user as { role?: string }).role;
    const id = paramStr(req, 'id');

    const sessao = await db.query.sessoesExecutadas.findFirst({
      where: eq(sessoesExecutadas.id, id),
      with: {
        treino: {
          with: {
            exercicios: {
              orderBy: [asc(exerciciosTreino.ordem)],
              with: { exercicio: true },
            },
          },
        },
        series: {
          orderBy: [asc(seriesExecutadas.concluidoEm)],
        },
      },
    });

    if (!sessao) {
      res.status(404).json({ error: 'sessao_nao_encontrada' });
      return;
    }

    const aluno = await alunoAcessivelPeloUsuario(sessao.alunoId, user.id, role ?? '');
    if (!aluno) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    res.json({ sessao });
  }),
);

sessoesRouter.post(
  '/sessoes',
  validateBody(sessaoIniciarSchema),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const role = (user as { role?: string }).role;
    if (role !== 'aluno') {
      res.status(403).json({ error: 'apenas_aluno' });
      return;
    }

    const aluno = await alunoDoUsuario(user.id);
    if (!aluno) {
      res.status(404).json({ error: 'aluno_nao_encontrado' });
      return;
    }

    const { treinoId, data } = req.body;

    const treino = await db
      .select({ treino: treinosProtocolo, protocolo: protocolos })
      .from(treinosProtocolo)
      .innerJoin(protocolos, eq(protocolos.id, treinosProtocolo.protocoloId))
      .where(
        and(eq(treinosProtocolo.id, treinoId), eq(protocolos.alunoId, aluno.id)),
      )
      .limit(1);

    if (!treino[0]) {
      res.status(404).json({ error: 'treino_nao_encontrado' });
      return;
    }

    const dataSessao = data ?? new Date().toISOString().slice(0, 10);

    const [sessao] = await db
      .insert(sessoesExecutadas)
      .values({
        alunoId: aluno.id,
        treinoId,
        data: dataSessao,
        horaInicio: new Date(),
      })
      .returning();

    res.status(201).json({ sessao });
  }),
);

sessoesRouter.post(
  '/sessoes/:id/series',
  validateBody(serieRegistrarSchema),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const role = (user as { role?: string }).role;
    if (role !== 'aluno') {
      res.status(403).json({ error: 'apenas_aluno' });
      return;
    }

    const aluno = await alunoDoUsuario(user.id);
    if (!aluno) {
      res.status(404).json({ error: 'aluno_nao_encontrado' });
      return;
    }

    const sessaoId = paramStr(req, 'id');
    const sessao = await db.query.sessoesExecutadas.findFirst({
      where: and(
        eq(sessoesExecutadas.id, sessaoId),
        eq(sessoesExecutadas.alunoId, aluno.id),
      ),
    });
    if (!sessao) {
      res.status(404).json({ error: 'sessao_nao_encontrada' });
      return;
    }
    if (sessao.horaFim) {
      res.status(409).json({ error: 'sessao_finalizada' });
      return;
    }

    const data = req.body;
    const [serie] = await db
      .insert(seriesExecutadas)
      .values({
        sessaoId,
        exercicioTreinoId: data.exercicioTreinoId,
        numeroSerie: data.numeroSerie,
        repsFeitas: data.repsFeitas,
        cargaKg: data.cargaKg.toString(),
      })
      .returning();

    res.status(201).json({ serie });
  }),
);

sessoesRouter.patch(
  '/series-executadas/:id',
  validateBody(serieAtualizarSchema),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const role = (user as { role?: string }).role;
    if (role !== 'aluno') {
      res.status(403).json({ error: 'apenas_aluno' });
      return;
    }

    const aluno = await alunoDoUsuario(user.id);
    if (!aluno) {
      res.status(404).json({ error: 'aluno_nao_encontrado' });
      return;
    }

    const id = paramStr(req, 'id');

    const existing = await db
      .select({ serie: seriesExecutadas, sessao: sessoesExecutadas })
      .from(seriesExecutadas)
      .innerJoin(
        sessoesExecutadas,
        eq(sessoesExecutadas.id, seriesExecutadas.sessaoId),
      )
      .where(
        and(eq(seriesExecutadas.id, id), eq(sessoesExecutadas.alunoId, aluno.id)),
      )
      .limit(1);

    if (!existing[0]) {
      res.status(404).json({ error: 'serie_nao_encontrada' });
      return;
    }

    const data = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (data.repsFeitas !== undefined) updates.repsFeitas = data.repsFeitas;
    if (data.cargaKg !== undefined) updates.cargaKg = data.cargaKg.toString();

    const [serie] = await db
      .update(seriesExecutadas)
      .set(updates)
      .where(eq(seriesExecutadas.id, id))
      .returning();

    res.json({ serie });
  }),
);

sessoesRouter.post(
  '/sessoes/:id/finalizar',
  validateBody(sessaoFinalizarSchema),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const role = (user as { role?: string }).role;
    if (role !== 'aluno') {
      res.status(403).json({ error: 'apenas_aluno' });
      return;
    }

    const aluno = await alunoDoUsuario(user.id);
    if (!aluno) {
      res.status(404).json({ error: 'aluno_nao_encontrado' });
      return;
    }

    const id = paramStr(req, 'id');
    const [sessao] = await db
      .update(sessoesExecutadas)
      .set({
        horaFim: new Date(),
        observacaoAluno: req.body.observacaoAluno ?? null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(sessoesExecutadas.id, id),
          eq(sessoesExecutadas.alunoId, aluno.id),
        ),
      )
      .returning();

    if (!sessao) {
      res.status(404).json({ error: 'sessao_nao_encontrada' });
      return;
    }

    res.json({ sessao });
  }),
);

sessoesRouter.get(
  '/sessoes',
  validateQuery(sessoesQuerySchema),
  asyncHandler(async (req, res) => {
    const user = req.user!;
    const role = (user as { role?: string }).role;
    const query = (req as unknown as { validatedQuery: { alunoId?: string; limit: number } })
      .validatedQuery;

    let alunoId: string;
    if (role === 'aluno') {
      const aluno = await alunoDoUsuario(user.id);
      if (!aluno) {
        res.status(404).json({ error: 'aluno_nao_encontrado' });
        return;
      }
      alunoId = aluno.id;
    } else if (role === 'personal') {
      if (!query.alunoId) {
        res.status(400).json({ error: 'alunoId_obrigatorio' });
        return;
      }
      const aluno = await alunoAcessivelPeloUsuario(query.alunoId, user.id, role);
      if (!aluno) {
        res.status(404).json({ error: 'aluno_nao_encontrado' });
        return;
      }
      alunoId = aluno.id;
    } else {
      res.status(403).json({ error: 'forbidden' });
      return;
    }

    const lista = await db.query.sessoesExecutadas.findMany({
      where: eq(sessoesExecutadas.alunoId, alunoId),
      orderBy: [desc(sessoesExecutadas.data), desc(sessoesExecutadas.horaInicio)],
      limit: query.limit,
      with: {
        treino: true,
        series: {
          with: {
            exercicioTreino: { with: { exercicio: true } },
          },
        },
      },
    });

    res.json({ sessoes: lista });
  }),
);

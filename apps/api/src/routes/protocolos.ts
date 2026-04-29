import { db } from '@repe/db';
import {
  exerciciosTreino,
  protocolos,
  treinosProtocolo,
} from '@repe/db/schema';
import {
  protocoloCreateSchema,
  protocoloUpdateSchema,
} from '@repe/shared/schemas';
import { and, asc, desc, eq } from 'drizzle-orm';
import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler.js';
import { alunoDoPersonal, protocoloDoPersonal } from '../lib/ownership.js';
import { paramStr } from '../lib/req.js';
import { personalOnly } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

export const protocolosRouter: Router = Router();

protocolosRouter.get(
  '/alunos/:alunoId/protocolos',
  ...personalOnly,
  asyncHandler(async (req, res) => {
    const personalId = req.user!.id;
    const alunoId = paramStr(req, 'alunoId');

    const aluno = await alunoDoPersonal(alunoId, personalId);
    if (!aluno) {
      res.status(404).json({ error: 'aluno_nao_encontrado' });
      return;
    }

    const lista = await db.query.protocolos.findMany({
      where: eq(protocolos.alunoId, alunoId),
      orderBy: [desc(protocolos.createdAt)],
    });

    res.json({ protocolos: lista });
  }),
);

protocolosRouter.post(
  '/alunos/:alunoId/protocolos',
  ...personalOnly,
  validateBody(protocoloCreateSchema),
  asyncHandler(async (req, res) => {
    const personalId = req.user!.id;
    const alunoId = paramStr(req, 'alunoId');

    const aluno = await alunoDoPersonal(alunoId, personalId);
    if (!aluno) {
      res.status(404).json({ error: 'aluno_nao_encontrado' });
      return;
    }

    const data = req.body;
    const [protocolo] = await db
      .insert(protocolos)
      .values({
        alunoId,
        nome: data.nome,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim ?? null,
        divisao: data.divisao,
      })
      .returning();

    res.status(201).json({ protocolo });
  }),
);

protocolosRouter.get(
  '/protocolos/:id',
  ...personalOnly,
  asyncHandler(async (req, res) => {
    const personalId = req.user!.id;
    const id = paramStr(req, 'id');

    const owned = await protocoloDoPersonal(id, personalId);
    if (!owned) {
      res.status(404).json({ error: 'protocolo_nao_encontrado' });
      return;
    }

    const detalhe = await db.query.protocolos.findFirst({
      where: eq(protocolos.id, id),
      with: {
        treinos: {
          orderBy: [asc(treinosProtocolo.ordem), asc(treinosProtocolo.letra)],
          with: {
            exercicios: {
              orderBy: [asc(exerciciosTreino.ordem)],
              with: { exercicio: true },
            },
          },
        },
      },
    });

    res.json({ protocolo: detalhe });
  }),
);

protocolosRouter.patch(
  '/protocolos/:id',
  ...personalOnly,
  validateBody(protocoloUpdateSchema),
  asyncHandler(async (req, res) => {
    const personalId = req.user!.id;
    const id = paramStr(req, 'id');

    const owned = await protocoloDoPersonal(id, personalId);
    if (!owned) {
      res.status(404).json({ error: 'protocolo_nao_encontrado' });
      return;
    }

    const [protocolo] = await db
      .update(protocolos)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(protocolos.id, id))
      .returning();

    res.json({ protocolo });
  }),
);

protocolosRouter.post(
  '/protocolos/:id/ativar',
  ...personalOnly,
  asyncHandler(async (req, res) => {
    const personalId = req.user!.id;
    const id = paramStr(req, 'id');

    const owned = await protocoloDoPersonal(id, personalId);
    if (!owned) {
      res.status(404).json({ error: 'protocolo_nao_encontrado' });
      return;
    }

    const protocolo = await db.transaction(async (tx) => {
      await tx
        .update(protocolos)
        .set({ status: 'arquivado', updatedAt: new Date() })
        .where(
          and(eq(protocolos.alunoId, owned.aluno.id), eq(protocolos.status, 'ativo')),
        );
      const [updated] = await tx
        .update(protocolos)
        .set({ status: 'ativo', updatedAt: new Date() })
        .where(eq(protocolos.id, id))
        .returning();
      return updated;
    });

    res.json({ protocolo });
  }),
);

protocolosRouter.post(
  '/protocolos/:id/duplicar',
  ...personalOnly,
  asyncHandler(async (req, res) => {
    const personalId = req.user!.id;
    const id = paramStr(req, 'id');

    const owned = await protocoloDoPersonal(id, personalId);
    if (!owned) {
      res.status(404).json({ error: 'protocolo_nao_encontrado' });
      return;
    }

    const fonte = await db.query.protocolos.findFirst({
      where: eq(protocolos.id, id),
      with: {
        treinos: {
          with: { exercicios: true },
        },
      },
    });
    if (!fonte) {
      res.status(404).json({ error: 'protocolo_nao_encontrado' });
      return;
    }

    const novo = await db.transaction(async (tx) => {
      const [protocoloNovo] = await tx
        .insert(protocolos)
        .values({
          alunoId: fonte.alunoId,
          nome: `${fonte.nome} (cópia)`,
          dataInicio: fonte.dataInicio,
          dataFim: fonte.dataFim,
          divisao: fonte.divisao,
          status: 'rascunho',
        })
        .returning();
      if (!protocoloNovo) throw new Error('falha_ao_duplicar');

      for (const treino of fonte.treinos) {
        const [treinoNovo] = await tx
          .insert(treinosProtocolo)
          .values({
            protocoloId: protocoloNovo.id,
            letra: treino.letra,
            nome: treino.nome,
            diasSemana: treino.diasSemana,
            ordem: treino.ordem,
          })
          .returning();
        if (!treinoNovo) throw new Error('falha_ao_duplicar_treino');

        if (treino.exercicios.length > 0) {
          await tx.insert(exerciciosTreino).values(
            treino.exercicios.map((ex) => ({
              treinoId: treinoNovo.id,
              exercicioId: ex.exercicioId,
              ordem: ex.ordem,
              series: ex.series,
              repsAlvo: ex.repsAlvo,
              cargaSugeridaKg: ex.cargaSugeridaKg,
              descansoSegundos: ex.descansoSegundos,
              observacao: ex.observacao,
              tipoSerie: ex.tipoSerie,
            })),
          );
        }
      }

      return protocoloNovo;
    });

    res.status(201).json({ protocolo: novo });
  }),
);

protocolosRouter.delete(
  '/protocolos/:id',
  ...personalOnly,
  asyncHandler(async (req, res) => {
    const personalId = req.user!.id;
    const id = paramStr(req, 'id');

    const owned = await protocoloDoPersonal(id, personalId);
    if (!owned) {
      res.status(404).json({ error: 'protocolo_nao_encontrado' });
      return;
    }

    if (owned.protocolo.status !== 'rascunho') {
      res.status(409).json({ error: 'apenas_rascunho_pode_ser_deletado' });
      return;
    }

    await db.delete(protocolos).where(eq(protocolos.id, id));
    res.status(204).send();
  }),
);

import { db } from '@repe/db';
import { exerciciosTreino, treinosProtocolo } from '@repe/db/schema';
import {
  exercicioReordenarSchema,
  exercicioTreinoCreateSchema,
  exercicioTreinoUpdateSchema,
  treinoCreateSchema,
  treinoUpdateSchema,
} from '@repe/shared/schemas';
import { and, asc, eq, max, sql } from 'drizzle-orm';
import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler.js';
import {
  exercicioTreinoDoPersonal,
  protocoloDoPersonal,
  treinoDoPersonal,
} from '../lib/ownership.js';
import { paramStr } from '../lib/req.js';
import { personalOnly } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

export const treinosRouter: Router = Router();

treinosRouter.post(
  '/protocolos/:protocoloId/treinos',
  ...personalOnly,
  validateBody(treinoCreateSchema),
  asyncHandler(async (req, res) => {
    const personalId = req.user!.id;
    const protocoloId = paramStr(req, 'protocoloId');

    const owned = await protocoloDoPersonal(protocoloId, personalId);
    if (!owned) {
      res.status(404).json({ error: 'protocolo_nao_encontrado' });
      return;
    }

    const data = req.body;
    let ordem = data.ordem;
    if (ordem === undefined) {
      const result = await db
        .select({ maxOrdem: max(treinosProtocolo.ordem) })
        .from(treinosProtocolo)
        .where(eq(treinosProtocolo.protocoloId, protocoloId));
      ordem = (result[0]?.maxOrdem ?? -1) + 1;
    }

    const [treino] = await db
      .insert(treinosProtocolo)
      .values({
        protocoloId,
        letra: data.letra,
        nome: data.nome,
        diasSemana: data.diasSemana ?? [],
        ordem,
      })
      .returning();

    res.status(201).json({ treino });
  }),
);

treinosRouter.patch(
  '/treinos/:id',
  ...personalOnly,
  validateBody(treinoUpdateSchema),
  asyncHandler(async (req, res) => {
    const personalId = req.user!.id;
    const id = paramStr(req, 'id');

    const owned = await treinoDoPersonal(id, personalId);
    if (!owned) {
      res.status(404).json({ error: 'treino_nao_encontrado' });
      return;
    }

    const [treino] = await db
      .update(treinosProtocolo)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(treinosProtocolo.id, id))
      .returning();

    res.json({ treino });
  }),
);

treinosRouter.post(
  '/treinos/:id/duplicar',
  ...personalOnly,
  asyncHandler(async (req, res) => {
    const personalId = req.user!.id;
    const id = paramStr(req, 'id');

    const owned = await treinoDoPersonal(id, personalId);
    if (!owned) {
      res.status(404).json({ error: 'treino_nao_encontrado' });
      return;
    }

    const fonte = await db.query.treinosProtocolo.findFirst({
      where: eq(treinosProtocolo.id, id),
      with: { exercicios: true },
    });
    if (!fonte) {
      res.status(404).json({ error: 'treino_nao_encontrado' });
      return;
    }

    const novo = await db.transaction(async (tx) => {
      const ordemResult = await tx
        .select({ maxOrdem: max(treinosProtocolo.ordem) })
        .from(treinosProtocolo)
        .where(eq(treinosProtocolo.protocoloId, fonte.protocoloId));

      const [treinoNovo] = await tx
        .insert(treinosProtocolo)
        .values({
          protocoloId: fonte.protocoloId,
          letra: fonte.letra,
          nome: `${fonte.nome} (cópia)`,
          diasSemana: [],
          ordem: (ordemResult[0]?.maxOrdem ?? -1) + 1,
        })
        .returning();
      if (!treinoNovo) throw new Error('falha_ao_duplicar');

      if (fonte.exercicios.length > 0) {
        await tx.insert(exerciciosTreino).values(
          fonte.exercicios.map((ex) => ({
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

      return treinoNovo;
    });

    res.status(201).json({ treino: novo });
  }),
);

treinosRouter.delete(
  '/treinos/:id',
  ...personalOnly,
  asyncHandler(async (req, res) => {
    const personalId = req.user!.id;
    const id = paramStr(req, 'id');

    const owned = await treinoDoPersonal(id, personalId);
    if (!owned) {
      res.status(404).json({ error: 'treino_nao_encontrado' });
      return;
    }

    await db.delete(treinosProtocolo).where(eq(treinosProtocolo.id, id));
    res.status(204).send();
  }),
);

treinosRouter.post(
  '/treinos/:treinoId/exercicios',
  ...personalOnly,
  validateBody(exercicioTreinoCreateSchema),
  asyncHandler(async (req, res) => {
    const personalId = req.user!.id;
    const treinoId = paramStr(req, 'treinoId');

    const owned = await treinoDoPersonal(treinoId, personalId);
    if (!owned) {
      res.status(404).json({ error: 'treino_nao_encontrado' });
      return;
    }

    const data = req.body;
    let ordem = data.ordem;
    if (ordem === undefined) {
      const result = await db
        .select({ maxOrdem: max(exerciciosTreino.ordem) })
        .from(exerciciosTreino)
        .where(eq(exerciciosTreino.treinoId, treinoId));
      ordem = (result[0]?.maxOrdem ?? -1) + 1;
    }

    const [item] = await db
      .insert(exerciciosTreino)
      .values({
        treinoId,
        exercicioId: data.exercicioId,
        ordem,
        series: data.series,
        repsAlvo: data.repsAlvo,
        cargaSugeridaKg: data.cargaSugeridaKg?.toString() ?? null,
        descansoSegundos: data.descansoSegundos,
        observacao: data.observacao ?? null,
        tipoSerie: data.tipoSerie,
      })
      .returning();

    res.status(201).json({ exercicioTreino: item });
  }),
);

treinosRouter.patch(
  '/exercicios-treino/:id',
  ...personalOnly,
  validateBody(exercicioTreinoUpdateSchema),
  asyncHandler(async (req, res) => {
    const personalId = req.user!.id;
    const id = paramStr(req, 'id');

    const owned = await exercicioTreinoDoPersonal(id, personalId);
    if (!owned) {
      res.status(404).json({ error: 'exercicio_treino_nao_encontrado' });
      return;
    }

    const data = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (data.series !== undefined) updates.series = data.series;
    if (data.repsAlvo !== undefined) updates.repsAlvo = data.repsAlvo;
    if (data.cargaSugeridaKg !== undefined) {
      updates.cargaSugeridaKg =
        data.cargaSugeridaKg === null ? null : data.cargaSugeridaKg.toString();
    }
    if (data.descansoSegundos !== undefined)
      updates.descansoSegundos = data.descansoSegundos;
    if (data.observacao !== undefined) updates.observacao = data.observacao;
    if (data.tipoSerie !== undefined) updates.tipoSerie = data.tipoSerie;
    if (data.ordem !== undefined) updates.ordem = data.ordem;

    const [item] = await db
      .update(exerciciosTreino)
      .set(updates)
      .where(eq(exerciciosTreino.id, id))
      .returning();

    res.json({ exercicioTreino: item });
  }),
);

treinosRouter.patch(
  '/treinos/:treinoId/exercicios/reordenar',
  ...personalOnly,
  validateBody(exercicioReordenarSchema),
  asyncHandler(async (req, res) => {
    const personalId = req.user!.id;
    const treinoId = paramStr(req, 'treinoId');

    const owned = await treinoDoPersonal(treinoId, personalId);
    if (!owned) {
      res.status(404).json({ error: 'treino_nao_encontrado' });
      return;
    }

    const ids: string[] = req.body.ids;

    await db.transaction(async (tx) => {
      for (let i = 0; i < ids.length; i++) {
        await tx
          .update(exerciciosTreino)
          .set({ ordem: i, updatedAt: new Date() })
          .where(
            and(
              eq(exerciciosTreino.id, ids[i]!),
              eq(exerciciosTreino.treinoId, treinoId),
            ),
          );
      }
    });

    const itens = await db.query.exerciciosTreino.findMany({
      where: eq(exerciciosTreino.treinoId, treinoId),
      orderBy: [asc(exerciciosTreino.ordem)],
    });

    res.json({ exercicios: itens });
  }),
);

treinosRouter.delete(
  '/exercicios-treino/:id',
  ...personalOnly,
  asyncHandler(async (req, res) => {
    const personalId = req.user!.id;
    const id = paramStr(req, 'id');

    const owned = await exercicioTreinoDoPersonal(id, personalId);
    if (!owned) {
      res.status(404).json({ error: 'exercicio_treino_nao_encontrado' });
      return;
    }

    await db.delete(exerciciosTreino).where(eq(exerciciosTreino.id, id));
    res.status(204).send();
  }),
);

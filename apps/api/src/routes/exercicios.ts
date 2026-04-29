import { db } from '@repe/db';
import { exercicios, exerciciosTreino } from '@repe/db/schema';
import {
  exercicioBuscaSchema,
  exercicioCreateSchema,
  exercicioUpdateSchema,
  extractYoutubeId,
} from '@repe/shared';
import { and, asc, eq, ilike, or, sql } from 'drizzle-orm';
import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler.js';
import { paramStr } from '../lib/req.js';
import { slugify } from '../lib/slug.js';
import { personalOnly } from '../middleware/auth.js';
import { validateBody, validateQuery } from '../middleware/validate.js';

export const exerciciosRouter: Router = Router();

exerciciosRouter.get(
  '/exercicios',
  ...personalOnly,
  validateQuery(exercicioBuscaSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const query = (req as unknown as { validatedQuery: { busca?: string; grupoMuscular?: string; equipamento?: string; escopo: 'publico' | 'privado' | 'todos' } }).validatedQuery;

    const conditions = [];

    if (query.escopo === 'publico') {
      conditions.push(eq(exercicios.escopo, 'publico'));
    } else if (query.escopo === 'privado') {
      conditions.push(
        and(eq(exercicios.escopo, 'privado'), eq(exercicios.criadoPor, userId)),
      );
    } else {
      conditions.push(
        or(
          eq(exercicios.escopo, 'publico'),
          and(eq(exercicios.escopo, 'privado'), eq(exercicios.criadoPor, userId)),
        ),
      );
    }

    if (query.busca && query.busca.trim().length > 0) {
      conditions.push(ilike(exercicios.nome, `%${query.busca.trim()}%`));
    }

    if (query.grupoMuscular) {
      conditions.push(
        eq(exercicios.grupoMuscularPrimario, query.grupoMuscular as never),
      );
    }

    if (query.equipamento) {
      conditions.push(eq(exercicios.equipamento, query.equipamento as never));
    }

    const lista = await db
      .select()
      .from(exercicios)
      .where(and(...conditions))
      .orderBy(asc(exercicios.nome))
      .limit(500);

    res.json({ exercicios: lista });
  }),
);

exerciciosRouter.post(
  '/exercicios',
  ...personalOnly,
  validateBody(exercicioCreateSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const data = req.body;

    const youtubeUrl =
      data.youtubeUrl && data.youtubeUrl !== '' ? data.youtubeUrl : null;
    const youtubeId = youtubeUrl ? extractYoutubeId(youtubeUrl) : null;

    const baseSlug = slugify(data.nome);
    let slug = baseSlug;
    let suffix = 0;
    while (true) {
      const exists = await db.query.exercicios.findFirst({
        where: eq(exercicios.slug, slug),
      });
      if (!exists) break;
      suffix += 1;
      slug = `${baseSlug}-${suffix}`;
      if (suffix > 100) {
        res.status(500).json({ error: 'falha_ao_gerar_slug' });
        return;
      }
    }

    const [exercicio] = await db
      .insert(exercicios)
      .values({
        nome: data.nome,
        slug,
        grupoMuscularPrimario: data.grupoMuscularPrimario,
        gruposSecundarios: data.gruposSecundarios ?? [],
        equipamento: data.equipamento,
        categoria: data.categoria,
        padraoMovimento: data.padraoMovimento ?? null,
        youtubeUrl,
        youtubeId,
        instrucoes: data.instrucoes ?? null,
        escopo: 'privado',
        criadoPor: userId,
      })
      .returning();

    res.status(201).json({ exercicio });
  }),
);

exerciciosRouter.patch(
  '/exercicios/:id',
  ...personalOnly,
  validateBody(exercicioUpdateSchema),
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const id = paramStr(req, 'id');

    const atual = await db.query.exercicios.findFirst({
      where: eq(exercicios.id, id),
    });
    if (!atual) {
      res.status(404).json({ error: 'exercicio_nao_encontrado' });
      return;
    }
    if (atual.criadoPor !== userId) {
      res.status(403).json({ error: 'apenas_criador_pode_editar' });
      return;
    }

    const data = req.body;
    const updates: Record<string, unknown> = { updatedAt: new Date() };

    if (data.nome !== undefined) updates.nome = data.nome;
    if (data.grupoMuscularPrimario !== undefined)
      updates.grupoMuscularPrimario = data.grupoMuscularPrimario;
    if (data.gruposSecundarios !== undefined)
      updates.gruposSecundarios = data.gruposSecundarios;
    if (data.equipamento !== undefined) updates.equipamento = data.equipamento;
    if (data.categoria !== undefined) updates.categoria = data.categoria;
    if (data.padraoMovimento !== undefined)
      updates.padraoMovimento = data.padraoMovimento;
    if (data.instrucoes !== undefined) updates.instrucoes = data.instrucoes;

    if (data.youtubeUrl !== undefined) {
      const youtubeUrl =
        data.youtubeUrl && data.youtubeUrl !== '' ? data.youtubeUrl : null;
      updates.youtubeUrl = youtubeUrl;
      updates.youtubeId = youtubeUrl ? extractYoutubeId(youtubeUrl) : null;
    }

    const [exercicio] = await db
      .update(exercicios)
      .set(updates)
      .where(eq(exercicios.id, id))
      .returning();

    res.json({ exercicio });
  }),
);

exerciciosRouter.delete(
  '/exercicios/:id',
  ...personalOnly,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const id = paramStr(req, 'id');

    const atual = await db.query.exercicios.findFirst({
      where: eq(exercicios.id, id),
    });
    if (!atual) {
      res.status(404).json({ error: 'exercicio_nao_encontrado' });
      return;
    }
    if (atual.criadoPor !== userId) {
      res.status(403).json({ error: 'apenas_criador_pode_deletar' });
      return;
    }

    const usageResult = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(exerciciosTreino)
      .where(eq(exerciciosTreino.exercicioId, id));

    if ((usageResult[0]?.count ?? 0) > 0) {
      res.status(409).json({ error: 'exercicio_em_uso' });
      return;
    }

    await db.delete(exercicios).where(eq(exercicios.id, id));
    res.status(204).send();
  }),
);

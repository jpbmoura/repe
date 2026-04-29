import { db } from '@repe/db';
import { alunos, convitesAluno } from '@repe/db/schema';
import { alunoCreateSchema, alunoUpdateSchema } from '@repe/shared/schemas';
import { and, desc, eq } from 'drizzle-orm';
import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler.js';
import { criarConviteUnico, regenerarCodigoConvite } from '../lib/codigo.js';
import { paramStr } from '../lib/req.js';
import { personalOnly } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';

export const alunosRouter: Router = Router();

alunosRouter.get(
  '/alunos',
  ...personalOnly,
  asyncHandler(async (req, res) => {
    const personalId = req.user!.id;
    const lista = await db
      .select({
        id: alunos.id,
        nome: alunos.nome,
        email: alunos.email,
        status: alunos.status,
        userId: alunos.userId,
        createdAt: alunos.createdAt,
        codigo: convitesAluno.codigo,
        codigoUsadoEm: convitesAluno.usadoEm,
      })
      .from(alunos)
      .leftJoin(convitesAluno, eq(convitesAluno.alunoId, alunos.id))
      .where(eq(alunos.personalId, personalId))
      .orderBy(desc(alunos.createdAt));

    res.json({ alunos: lista });
  }),
);

alunosRouter.post(
  '/alunos',
  ...personalOnly,
  validateBody(alunoCreateSchema),
  asyncHandler(async (req, res) => {
    const personalId = req.user!.id;
    const data = req.body;

    const [aluno] = await db
      .insert(alunos)
      .values({
        personalId,
        nome: data.nome,
        email: data.email,
        dataNascimento: data.dataNascimento ?? null,
        sexo: data.sexo ?? null,
        objetivo: data.objetivo ?? null,
        observacoes: data.observacoes ?? null,
      })
      .returning();

    if (!aluno) {
      res.status(500).json({ error: 'falha_ao_criar_aluno' });
      return;
    }

    const codigo = await criarConviteUnico(aluno.id);

    res.status(201).json({ aluno, codigo });
  }),
);

alunosRouter.get(
  '/alunos/:id',
  ...personalOnly,
  asyncHandler(async (req, res) => {
    const personalId = req.user!.id;
    const id = paramStr(req, 'id');

    const aluno = await db.query.alunos.findFirst({
      where: and(eq(alunos.id, id), eq(alunos.personalId, personalId)),
      with: { convite: true },
    });

    if (!aluno) {
      res.status(404).json({ error: 'aluno_nao_encontrado' });
      return;
    }

    res.json({ aluno });
  }),
);

alunosRouter.patch(
  '/alunos/:id',
  ...personalOnly,
  validateBody(alunoUpdateSchema),
  asyncHandler(async (req, res) => {
    const personalId = req.user!.id;
    const id = paramStr(req, 'id');
    const data = req.body;

    const [aluno] = await db
      .update(alunos)
      .set({ ...data, updatedAt: new Date() })
      .where(and(eq(alunos.id, id), eq(alunos.personalId, personalId)))
      .returning();

    if (!aluno) {
      res.status(404).json({ error: 'aluno_nao_encontrado' });
      return;
    }

    res.json({ aluno });
  }),
);

alunosRouter.delete(
  '/alunos/:id',
  ...personalOnly,
  asyncHandler(async (req, res) => {
    const personalId = req.user!.id;
    const id = paramStr(req, 'id');

    const [aluno] = await db
      .update(alunos)
      .set({ status: 'inativo', updatedAt: new Date() })
      .where(and(eq(alunos.id, id), eq(alunos.personalId, personalId)))
      .returning();

    if (!aluno) {
      res.status(404).json({ error: 'aluno_nao_encontrado' });
      return;
    }

    res.status(204).send();
  }),
);

alunosRouter.post(
  '/alunos/:id/regenerar-codigo',
  ...personalOnly,
  asyncHandler(async (req, res) => {
    const personalId = req.user!.id;
    const id = paramStr(req, 'id');

    const aluno = await db.query.alunos.findFirst({
      where: and(eq(alunos.id, id), eq(alunos.personalId, personalId)),
    });

    if (!aluno) {
      res.status(404).json({ error: 'aluno_nao_encontrado' });
      return;
    }

    if (aluno.userId) {
      res.status(409).json({ error: 'aluno_ja_cadastrado' });
      return;
    }

    const codigo = await regenerarCodigoConvite(id);
    res.json({ codigo });
  }),
);

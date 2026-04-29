import { db } from '@repe/db';
import { alunos, convitesAluno, personalProfiles } from '@repe/db/schema';
import {
  cadastroAlunoSchema,
  cadastroPersonalSchema,
} from '@repe/shared/schemas';
import { fromNodeHeaders } from 'better-auth/node';
import { and, eq, gt, isNull, sql } from 'drizzle-orm';
import { Router } from 'express';
import { auth } from '../auth.js';
import { logger } from '../lib/logger.js';
import { validateBody } from '../middleware/validate.js';

export const cadastroRouter: Router = Router();

cadastroRouter.post(
  '/cadastro/personal',
  validateBody(cadastroPersonalSchema),
  async (req, res) => {
    const { nome, email, password } = req.body;

    try {
      const result = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name: nome,
          nome,
          role: 'personal',
        },
        headers: fromNodeHeaders(req.headers),
        asResponse: true,
      });

      if (!result.ok) {
        const text = await result.text();
        res.status(result.status).type('application/json').send(text);
        return;
      }

      const data = (await result.clone().json()) as { user?: { id: string } };
      if (data.user?.id) {
        await db
          .insert(personalProfiles)
          .values({ userId: data.user.id })
          .onConflictDoNothing();
      }

      result.headers.forEach((value, key) => {
        const k = key.toLowerCase();
        if (k === 'set-cookie') {
          res.append('Set-Cookie', value);
        } else if (k === 'set-auth-token') {
          res.setHeader('set-auth-token', value);
        }
      });
      res.status(result.status).type('application/json').send(await result.text());
    } catch (err) {
      logger.error({ err }, 'cadastro_personal_failed');
      res.status(500).json({ error: 'cadastro_failed' });
    }
  },
);

cadastroRouter.post(
  '/cadastro/aluno',
  validateBody(cadastroAlunoSchema),
  async (req, res) => {
    const { nome, email, password, codigo } = req.body;

    const convite = await db.query.convitesAluno.findFirst({
      where: and(
        eq(convitesAluno.codigo, codigo),
        isNull(convitesAluno.usadoEm),
        gt(convitesAluno.expiresAt, new Date()),
      ),
    });

    if (!convite) {
      res.status(400).json({ error: 'codigo_invalido' });
      return;
    }

    const aluno = await db.query.alunos.findFirst({
      where: eq(alunos.id, convite.alunoId),
    });

    if (!aluno) {
      res.status(400).json({ error: 'aluno_nao_encontrado' });
      return;
    }

    if (aluno.userId) {
      res.status(409).json({ error: 'aluno_ja_cadastrado' });
      return;
    }

    try {
      const result = await auth.api.signUpEmail({
        body: {
          email,
          password,
          name: nome,
          nome,
          role: 'aluno',
        },
        headers: fromNodeHeaders(req.headers),
        asResponse: true,
      });

      if (!result.ok) {
        const text = await result.text();
        res.status(result.status).type('application/json').send(text);
        return;
      }

      const cloneForJson = result.clone();
      const data = (await cloneForJson.json()) as { user?: { id: string } };

      if (!data.user?.id) {
        res.status(500).json({ error: 'cadastro_failed' });
        return;
      }

      await db.transaction(async (tx) => {
        await tx
          .update(alunos)
          .set({ userId: data.user!.id, updatedAt: new Date() })
          .where(eq(alunos.id, convite.alunoId));
        await tx
          .update(convitesAluno)
          .set({ usadoEm: sql`now()`, updatedAt: new Date() })
          .where(eq(convitesAluno.id, convite.id));
      });

      result.headers.forEach((value, key) => {
        const k = key.toLowerCase();
        if (k === 'set-cookie') {
          res.append('Set-Cookie', value);
        } else if (k === 'set-auth-token') {
          res.setHeader('set-auth-token', value);
        }
      });
      res.status(result.status).type('application/json').send(await result.text());
    } catch (err) {
      logger.error({ err }, 'cadastro_aluno_failed');
      res.status(500).json({ error: 'cadastro_failed' });
    }
  },
);

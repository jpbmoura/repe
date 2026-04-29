import { db } from '@repe/db';
import { sql } from 'drizzle-orm';
import { Router } from 'express';
import { asyncHandler } from '../lib/async-handler.js';
import { personalOnly } from '../middleware/auth.js';

export const personalDashboardRouter: Router = Router();

personalDashboardRouter.get(
  '/personal/dashboard',
  ...personalOnly,
  asyncHandler(async (req, res) => {
    const personalId = req.user!.id;
    const diaHoje = new Date().getDay();

    const [ativosRow, hojeRow, prsRow] = await Promise.all([
      db.execute(sql`
        SELECT COUNT(*)::int AS count
        FROM alunos
        WHERE personal_id = ${personalId}
          AND status = 'ativo'
      `),
      db.execute(sql`
        SELECT COUNT(DISTINCT a.id)::int AS count
        FROM alunos a
        JOIN protocolos p ON p.aluno_id = a.id AND p.status = 'ativo'
        JOIN treinos_protocolo t ON t.protocolo_id = p.id
        WHERE a.personal_id = ${personalId}
          AND ${diaHoje} = ANY(t.dias_semana)
      `),
      db.execute(sql`
        SELECT COUNT(*)::int AS count
        FROM series_executadas s
        JOIN sessoes_executadas se ON se.id = s.sessao_id
        JOIN exercicios_treino et ON et.id = s.exercicio_treino_id
        JOIN alunos a ON a.id = se.aluno_id
        WHERE a.personal_id = ${personalId}
          AND s.concluido_em > NOW() - INTERVAL '7 days'
          AND s.carga_kg::numeric > COALESCE((
            SELECT MAX(s2.carga_kg::numeric)
            FROM series_executadas s2
            JOIN sessoes_executadas se2 ON se2.id = s2.sessao_id
            JOIN exercicios_treino et2 ON et2.id = s2.exercicio_treino_id
            WHERE et2.exercicio_id = et.exercicio_id
              AND se2.aluno_id = se.aluno_id
              AND s2.concluido_em < s.concluido_em
          ), 0)
      `),
    ]);

    const ativos = Number((ativosRow[0] as { count: number } | undefined)?.count ?? 0);
    const hojeEsperados = Number(
      (hojeRow[0] as { count: number } | undefined)?.count ?? 0,
    );
    const prsSemana = Number((prsRow[0] as { count: number } | undefined)?.count ?? 0);

    res.json({ ativos, hojeEsperados, prsSemana });
  }),
);

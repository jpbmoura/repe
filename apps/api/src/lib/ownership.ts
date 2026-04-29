import { db } from '@repe/db';
import {
  alunos,
  exerciciosTreino,
  protocolos,
  treinosProtocolo,
} from '@repe/db/schema';
import { and, eq } from 'drizzle-orm';

export async function alunoDoPersonal(alunoId: string, personalId: string) {
  const aluno = await db.query.alunos.findFirst({
    where: and(eq(alunos.id, alunoId), eq(alunos.personalId, personalId)),
  });
  return aluno ?? null;
}

export async function protocoloDoPersonal(protocoloId: string, personalId: string) {
  const result = await db
    .select({ protocolo: protocolos, aluno: alunos })
    .from(protocolos)
    .innerJoin(alunos, eq(alunos.id, protocolos.alunoId))
    .where(and(eq(protocolos.id, protocoloId), eq(alunos.personalId, personalId)))
    .limit(1);
  return result[0] ?? null;
}

export async function treinoDoPersonal(treinoId: string, personalId: string) {
  const result = await db
    .select({
      treino: treinosProtocolo,
      protocolo: protocolos,
      aluno: alunos,
    })
    .from(treinosProtocolo)
    .innerJoin(protocolos, eq(protocolos.id, treinosProtocolo.protocoloId))
    .innerJoin(alunos, eq(alunos.id, protocolos.alunoId))
    .where(
      and(eq(treinosProtocolo.id, treinoId), eq(alunos.personalId, personalId)),
    )
    .limit(1);
  return result[0] ?? null;
}

export async function exercicioTreinoDoPersonal(
  exercicioTreinoId: string,
  personalId: string,
) {
  const result = await db
    .select({
      exercicioTreino: exerciciosTreino,
      treino: treinosProtocolo,
      protocolo: protocolos,
      aluno: alunos,
    })
    .from(exerciciosTreino)
    .innerJoin(treinosProtocolo, eq(treinosProtocolo.id, exerciciosTreino.treinoId))
    .innerJoin(protocolos, eq(protocolos.id, treinosProtocolo.protocoloId))
    .innerJoin(alunos, eq(alunos.id, protocolos.alunoId))
    .where(
      and(
        eq(exerciciosTreino.id, exercicioTreinoId),
        eq(alunos.personalId, personalId),
      ),
    )
    .limit(1);
  return result[0] ?? null;
}

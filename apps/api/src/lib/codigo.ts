import { db } from '@repe/db';
import { convitesAluno } from '@repe/db/schema';
import { gerarCodigoConvite } from '@repe/shared';
import { sql } from 'drizzle-orm';

const MAX_TENTATIVAS = 8;

export async function criarConviteUnico(alunoId: string): Promise<string> {
  let ultimoErro: unknown;
  for (let i = 0; i < MAX_TENTATIVAS; i++) {
    const codigo = gerarCodigoConvite();
    try {
      await db.insert(convitesAluno).values({ alunoId, codigo });
      return codigo;
    } catch (err) {
      ultimoErro = err;
    }
  }
  throw ultimoErro ?? new Error('falha_ao_gerar_codigo');
}

export async function regenerarCodigoConvite(alunoId: string): Promise<string> {
  let ultimoErro: unknown;
  for (let i = 0; i < MAX_TENTATIVAS; i++) {
    const codigo = gerarCodigoConvite();
    try {
      const updated = await db
        .update(convitesAluno)
        .set({
          codigo,
          usadoEm: null,
          expiresAt: sql`now() + interval '30 days'`,
          updatedAt: new Date(),
        })
        .where(sql`${convitesAluno.alunoId} = ${alunoId}`)
        .returning({ id: convitesAluno.id });
      if (updated.length > 0) return codigo;
      throw new Error('convite_nao_encontrado');
    } catch (err) {
      ultimoErro = err;
    }
  }
  throw ultimoErro ?? new Error('falha_ao_regenerar_codigo');
}

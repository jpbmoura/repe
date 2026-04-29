import { relations } from 'drizzle-orm';
import { alunos, convitesAluno } from './alunos.js';
import { account, session, user } from './auth.js';
import { exercicios } from './exercicios.js';
import { personalProfiles } from './personal.js';
import { exerciciosTreino, protocolos, treinosProtocolo } from './protocolos.js';
import { seriesExecutadas, sessoesExecutadas } from './sessoes.js';

export const userRelations = relations(user, ({ one, many }) => ({
  personalProfile: one(personalProfiles, {
    fields: [user.id],
    references: [personalProfiles.userId],
  }),
  sessions: many(session),
  accounts: many(account),
  alunosComoPersonal: many(alunos, { relationName: 'personalAlunos' }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const personalProfileRelations = relations(personalProfiles, ({ one }) => ({
  user: one(user, { fields: [personalProfiles.userId], references: [user.id] }),
}));

export const alunosRelations = relations(alunos, ({ one, many }) => ({
  personal: one(user, {
    fields: [alunos.personalId],
    references: [user.id],
    relationName: 'personalAlunos',
  }),
  user: one(user, { fields: [alunos.userId], references: [user.id] }),
  convite: one(convitesAluno, {
    fields: [alunos.id],
    references: [convitesAluno.alunoId],
  }),
  protocolos: many(protocolos),
  sessoes: many(sessoesExecutadas),
}));

export const convitesAlunoRelations = relations(convitesAluno, ({ one }) => ({
  aluno: one(alunos, { fields: [convitesAluno.alunoId], references: [alunos.id] }),
}));

export const exerciciosRelations = relations(exercicios, ({ one, many }) => ({
  criador: one(user, { fields: [exercicios.criadoPor], references: [user.id] }),
  prescricoes: many(exerciciosTreino),
}));

export const protocolosRelations = relations(protocolos, ({ one, many }) => ({
  aluno: one(alunos, { fields: [protocolos.alunoId], references: [alunos.id] }),
  treinos: many(treinosProtocolo),
}));

export const treinosProtocoloRelations = relations(treinosProtocolo, ({ one, many }) => ({
  protocolo: one(protocolos, {
    fields: [treinosProtocolo.protocoloId],
    references: [protocolos.id],
  }),
  exercicios: many(exerciciosTreino),
  sessoes: many(sessoesExecutadas),
}));

export const exerciciosTreinoRelations = relations(exerciciosTreino, ({ one, many }) => ({
  treino: one(treinosProtocolo, {
    fields: [exerciciosTreino.treinoId],
    references: [treinosProtocolo.id],
  }),
  exercicio: one(exercicios, {
    fields: [exerciciosTreino.exercicioId],
    references: [exercicios.id],
  }),
  series: many(seriesExecutadas),
}));

export const sessoesExecutadasRelations = relations(sessoesExecutadas, ({ one, many }) => ({
  aluno: one(alunos, { fields: [sessoesExecutadas.alunoId], references: [alunos.id] }),
  treino: one(treinosProtocolo, {
    fields: [sessoesExecutadas.treinoId],
    references: [treinosProtocolo.id],
  }),
  series: many(seriesExecutadas),
}));

export const seriesExecutadasRelations = relations(seriesExecutadas, ({ one }) => ({
  sessao: one(sessoesExecutadas, {
    fields: [seriesExecutadas.sessaoId],
    references: [sessoesExecutadas.id],
  }),
  exercicioTreino: one(exerciciosTreino, {
    fields: [seriesExecutadas.exercicioTreinoId],
    references: [exerciciosTreino.id],
  }),
}));

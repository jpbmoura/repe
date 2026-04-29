export * from './enums.js';
export * from './auth.js';
export * from './personal.js';
export * from './alunos.js';
export * from './exercicios.js';
export * from './protocolos.js';
export * from './sessoes.js';
export * from './relations.js';

import { type InferInsertModel, type InferSelectModel } from 'drizzle-orm';
import { alunos, convitesAluno } from './alunos.js';
import { account, session, user, verification } from './auth.js';
import { exercicios } from './exercicios.js';
import { personalProfiles } from './personal.js';
import { exerciciosTreino, protocolos, treinosProtocolo } from './protocolos.js';
import { seriesExecutadas, sessoesExecutadas } from './sessoes.js';

export type User = InferSelectModel<typeof user>;
export type NewUser = InferInsertModel<typeof user>;
export type Session = InferSelectModel<typeof session>;
export type Account = InferSelectModel<typeof account>;
export type Verification = InferSelectModel<typeof verification>;

export type PersonalProfile = InferSelectModel<typeof personalProfiles>;
export type NewPersonalProfile = InferInsertModel<typeof personalProfiles>;

export type Aluno = InferSelectModel<typeof alunos>;
export type NewAluno = InferInsertModel<typeof alunos>;
export type ConviteAluno = InferSelectModel<typeof convitesAluno>;
export type NewConviteAluno = InferInsertModel<typeof convitesAluno>;

export type Exercicio = InferSelectModel<typeof exercicios>;
export type NewExercicio = InferInsertModel<typeof exercicios>;

export type Protocolo = InferSelectModel<typeof protocolos>;
export type NewProtocolo = InferInsertModel<typeof protocolos>;
export type TreinoProtocolo = InferSelectModel<typeof treinosProtocolo>;
export type NewTreinoProtocolo = InferInsertModel<typeof treinosProtocolo>;
export type ExercicioTreino = InferSelectModel<typeof exerciciosTreino>;
export type NewExercicioTreino = InferInsertModel<typeof exerciciosTreino>;

export type SessaoExecutada = InferSelectModel<typeof sessoesExecutadas>;
export type NewSessaoExecutada = InferInsertModel<typeof sessoesExecutadas>;
export type SerieExecutada = InferSelectModel<typeof seriesExecutadas>;
export type NewSerieExecutada = InferInsertModel<typeof seriesExecutadas>;

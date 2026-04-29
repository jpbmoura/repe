import { env } from './env.js';
import { toNodeHandler } from 'better-auth/node';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { auth } from './auth.js';
import { alunosRouter } from './routes/alunos.js';
import { exerciciosRouter } from './routes/exercicios.js';
import { personalDashboardRouter } from './routes/personal-dashboard.js';
import { protocolosRouter } from './routes/protocolos.js';
import { sessoesRouter } from './routes/sessoes.js';
import { treinosRouter } from './routes/treinos.js';
import { volumeRouter } from './routes/volume.js';
import { logger } from './lib/logger.js';
import { loadSession } from './middleware/auth.js';
import { cadastroRouter } from './routes/cadastro.js';
import { healthRouter } from './routes/health.js';
import { meRouter } from './routes/me.js';

const app = express();

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
);
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    exposedHeaders: ['set-auth-token'],
  }),
);
app.use(pinoHttp({ logger }));

app.all('/api/auth/*splat', toNodeHandler(auth));

app.use(express.json());
app.use(loadSession);

app.use('/api', healthRouter);
app.use('/api', meRouter);
app.use('/api', cadastroRouter);
app.use('/api', alunosRouter);
app.use('/api', protocolosRouter);
app.use('/api', treinosRouter);
app.use('/api', exerciciosRouter);
app.use('/api', sessoesRouter);
app.use('/api', volumeRouter);
app.use('/api', personalDashboardRouter);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error({ err }, 'unhandled_error');
  res.status(500).json({ error: 'internal_server_error' });
});

app.listen(env.PORT, () => {
  logger.info(`API listening on http://localhost:${env.PORT}`);
});

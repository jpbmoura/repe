import pino from 'pino';
import { env } from '../env.js';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  ...(env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino/file',
      options: { destination: 1 },
    },
  }),
});

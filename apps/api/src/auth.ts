import { env } from './env.js';
import { db } from '@repe/db';
import * as schema from '@repe/db/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    autoSignIn: true,
  },
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'personal',
        input: true,
      },
      nome: {
        type: 'string',
        required: true,
        input: true,
      },
    },
  },
  trustedOrigins: [env.CORS_ORIGIN],
  ...(env.NODE_ENV === 'production' && {
    advanced: {
      defaultCookieAttributes: {
        sameSite: 'none',
        secure: true,
      },
    },
  }),
});

export type Auth = typeof auth;

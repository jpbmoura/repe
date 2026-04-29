import { inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_AUTH_URL,
  fetchOptions: { credentials: 'include' },
  plugins: [
    inferAdditionalFields({
      user: {
        role: { type: 'string', defaultValue: 'personal' },
        nome: { type: 'string', required: true },
      },
    }),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;

import { inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

const TOKEN_KEY = 'repe.bearer_token';

export const authStorage = {
  get(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore
    }
  },
  clear() {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_AUTH_URL,
  fetchOptions: {
    credentials: 'include',
    auth: {
      type: 'Bearer',
      token: () => authStorage.get() ?? '',
    },
    onSuccess: (ctx: { response: Response }) => {
      const token = ctx.response.headers.get('set-auth-token');
      if (token) {
        authStorage.set(token);
      }
    },
  },
  plugins: [
    inferAdditionalFields({
      user: {
        role: { type: 'string', defaultValue: 'personal' },
        nome: { type: 'string', required: true },
      },
    }),
  ],
});

const { signIn, signUp, useSession } = authClient;

async function signOutCompleto() {
  try {
    await authClient.signOut();
  } finally {
    authStorage.clear();
    const { clearSession } = await import('./session');
    clearSession();
  }
}

export { signIn, signUp, useSession, signOutCompleto as signOut };

import { authClient } from './auth-client';
import { queryClient } from './query-client';

export const sessionKey = ['auth', 'session'] as const;

export async function fetchSession() {
  const { data } = await authClient.getSession();
  return data;
}

export type SessionData = Awaited<ReturnType<typeof fetchSession>>;

export const SESSION_STALE_TIME = 5 * 60 * 1000;

export function ensureSession() {
  return queryClient.ensureQueryData({
    queryKey: sessionKey,
    queryFn: fetchSession,
    staleTime: SESSION_STALE_TIME,
  });
}

export function invalidateSession() {
  // Removemos do cache (em vez de só invalidar) porque `ensureQueryData`
  // — usado no `beforeLoad` — retorna cache stale sem refetch. Isso fazia
  // o login aparentar travar no iOS: signIn ok, navigate ok, mas o
  // `ensureQueryData` devolvia o `null` do cache anterior (deslogado),
  // redirecionando de volta pro /login. Removendo, o próximo
  // `ensureQueryData` força fetch fresh.
  queryClient.removeQueries({ queryKey: sessionKey });
}

export function clearSession() {
  queryClient.removeQueries({ queryKey: sessionKey });
}

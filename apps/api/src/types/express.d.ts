import type { Auth } from '../auth.js';

type AuthSession = Awaited<ReturnType<Auth['api']['getSession']>>;
type SessionUser = NonNullable<AuthSession>['user'];
type SessionData = NonNullable<AuthSession>['session'];

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
      session?: SessionData;
    }
  }
}

export {};

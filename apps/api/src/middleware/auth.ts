import { fromNodeHeaders } from 'better-auth/node';
import type { NextFunction, Request, RequestHandler, Response } from 'express';
import { auth } from '../auth.js';

export async function loadSession(req: Request, _res: Response, next: NextFunction) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  });
  if (session) {
    req.user = session.user;
    req.session = session.session;
  }
  next();
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  next();
}

export function requireRole(role: 'personal' | 'aluno') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    const userRole = (req.user as { role?: string }).role;
    if (userRole !== role) {
      res.status(403).json({ error: 'forbidden' });
      return;
    }
    next();
  };
}

export const personalOnly: RequestHandler[] = [
  requireAuth,
  requireRole('personal'),
];

export const alunoOnly: RequestHandler[] = [requireAuth, requireRole('aluno')];

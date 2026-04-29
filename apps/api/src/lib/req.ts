import type { Request } from 'express';

export function paramStr(req: Request, key: string): string {
  const v = req.params[key];
  if (typeof v !== 'string') {
    throw new Error(`Parâmetro de rota "${key}" inválido`);
  }
  return v;
}

import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';

export const meRouter: Router = Router();

meRouter.get('/me', requireAuth, (req, res) => {
  res.json({
    user: req.user,
    session: req.session,
  });
});

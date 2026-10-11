import type { Request, Response } from 'express';

import { HttpError, ah } from '../../lib/http';
import { signToken } from '../../middleware/auth';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function nameFromEmail(email: string): string {
  const local = email.split('@')[0] ?? 'admin';
  return (
    local.replace(/[._]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Admin'
  );
}

/**
 * POST /admin/auth/login — Body: { email, password }
 * Demo auth: any valid email + a 6+ char password signs an admin JWT.
 */
export const login = ah(async (req: Request, res: Response) => {
  const { email, password } = req.body ?? {};
  if (!email || !emailRegex.test(String(email)))
    throw new HttpError('Enter a valid email address', 400);
  if (!password || String(password).length < 6)
    throw new HttpError('Password must be at least 6 characters', 400);

  const user = { name: nameFromEmail(String(email)), email: String(email), role: 'Operations Admin' };
  const token = signToken({ userId: `admin:${email}`, email: String(email), role: 'admin' });
  res.json({ token, user });
});

/** GET /admin/auth/me — echoes the authenticated admin from the token. */
export const me = ah(async (req: Request, res: Response) => {
  const email = req.user!.email;
  res.json({ name: nameFromEmail(email), email, role: 'Operations Admin' });
});

/** POST /admin/auth/forgot — Body: { email }. Demo: always ok. */
export const forgot = ah(async (req: Request, res: Response) => {
  const { email } = req.body ?? {};
  if (!email || !emailRegex.test(String(email)))
    throw new HttpError('Enter a valid email address', 400);
  res.json({ ok: true });
});

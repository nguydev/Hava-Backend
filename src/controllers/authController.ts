import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import type { Request, Response } from 'express';

import { HttpError, ah } from '../lib/http';
import { signToken } from '../middleware/auth';
import { User } from '../models';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Case-insensitive exact email match. */
const byEmail = (email: string) =>
  User.findOne({ email: new RegExp(`^${escapeRegex(email)}$`, 'i') });

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * POST /auth/login
 * Body: { email, password, role }
 *
 * If the email belongs to a registered account, the password is verified.
 * Otherwise the caller is signed into the shared demo account for the selected
 * role — preserving the app's "use any email & password" demo experience.
 */
export const login = ah(async (req: Request, res: Response) => {
  const { email, password, role } = req.body ?? {};
  if (!email || !password) throw new HttpError('Email and password are required', 400);
  if (role !== 'contractor' && role !== 'driver')
    throw new HttpError('Select a valid role', 400);

  const found = await byEmail(String(email));

  let user = found && found.role === role ? found : null;

  if (user && !user.isDemo && user.passwordHash) {
    const ok = await bcrypt.compare(String(password), user.passwordHash);
    if (!ok) throw new HttpError('Incorrect email or password', 401);
  }

  if (!user) {
    // Fall back to the canonical demo account for this role.
    user = await User.findOne({ id: role === 'driver' ? 'u-driver' : 'u-contractor' });
    if (!user) throw new HttpError('Demo account not seeded. Run `npm run seed`.', 500);
  }

  const token = signToken({ userId: user.id, email: user.email, role: user.role });
  res.json({ token, user: user.toJSON() });
});

/**
 * POST /auth/register
 * Body: { company, contactName, email, phone, password }
 * Creates a contractor account (pending approval is auto-approved for the demo)
 * and returns a request id — the app then routes to its login screen.
 */
export const register = ah(async (req: Request, res: Response) => {
  const { company, contactName, email, phone, password, vehicle } = req.body ?? {};
  const role = req.body?.role === 'driver' ? 'driver' : 'contractor';

  if (!contactName || !email || !phone || !password)
    throw new HttpError('All fields are required', 400);
  if (role === 'contractor' && !company)
    throw new HttpError('Company name is required', 400);
  if (!emailRegex.test(String(email)))
    throw new HttpError('Enter a valid email address', 400);
  if (String(password).length < 8)
    throw new HttpError('Password must be at least 8 characters', 400);

  const existing = await byEmail(String(email));
  if (existing) throw new HttpError('An account with that email already exists', 409);

  const passwordHash = await bcrypt.hash(String(password), 10);
  await User.create({
    id: `usr_${Date.now()}_${Math.floor(Math.random() * 1e4)}`,
    role,
    name: contactName,
    email,
    phone,
    approval: 'Approved',
    isDemo: false,
    passwordHash,
    ...(role === 'contractor'
      ? { company, businessType: 'Contractor' }
      : { vehicle: vehicle ?? '', driverStatus: 'Offline', completedDeliveries: 0, rating: 5 }),
  });

  res.status(201).json({ requestId: `REQ-${Date.now().toString().slice(-6)}`, role });
});

/** POST /auth/forgot-password — always returns ok (no account enumeration). */
export const forgotPassword = ah(async (req: Request, res: Response) => {
  const { email } = req.body ?? {};
  if (!email) throw new HttpError('Email is required', 400);

  const user = await byEmail(String(email));
  if (user) {
    const code = String(crypto.randomInt(10000, 100000)); // 5 digits
    user.otpCode = code;
    user.otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();
    // In production this would be emailed; logged here for the demo.
    console.log(`[GOODR] OTP for ${user.email}: ${code}`);
  }

  res.json({ ok: true });
});

/** POST /auth/verify-otp — Body: { email, code } */
export const verifyOtp = ah(async (req: Request, res: Response) => {
  const { email, code } = req.body ?? {};
  const user = await byEmail(String(email ?? ''));
  const valid =
    !!user &&
    !!user.otpCode &&
    user.otpCode === String(code) &&
    !!user.otpExpiresAt &&
    user.otpExpiresAt.getTime() > Date.now();

  if (!valid) throw new HttpError('Invalid or expired code', 400);
  res.json({ valid: true });
});

/** POST /auth/reset-password — Body: { email, otp, newPassword } */
export const resetPassword = ah(async (req: Request, res: Response) => {
  const { email, otp, newPassword } = req.body ?? {};
  if (!newPassword || String(newPassword).length < 8)
    throw new HttpError('Password must be at least 8 characters', 400);

  const user = await byEmail(String(email ?? ''));
  const valid =
    !!user &&
    !!user.otpCode &&
    user.otpCode === String(otp) &&
    !!user.otpExpiresAt &&
    user.otpExpiresAt.getTime() > Date.now();

  if (!user || !valid) throw new HttpError('Invalid or expired code', 400);

  user.passwordHash = await bcrypt.hash(String(newPassword), 10);
  user.otpCode = null;
  user.otpExpiresAt = null;
  user.isDemo = false;
  await user.save();

  res.json({ ok: true });
});

/** GET /auth/me — returns the authenticated user. */
export const me = ah(async (req: Request, res: Response) => {
  const user = await User.findOne({ id: req.user!.userId });
  if (!user) throw new HttpError('User not found', 404);
  res.json(user.toJSON());
});

/**
 * POST /auth/change-password — Body: { currentPassword, newPassword }
 * For registered accounts the current password is verified; demo/canonical
 * accounts (no stored password) skip that check and become real accounts.
 */
export const changePassword = ah(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body ?? {};
  if (!newPassword || String(newPassword).length < 8)
    throw new HttpError('New password must be at least 8 characters', 400);

  const user = await User.findOne({ id: req.user!.userId });
  if (!user) throw new HttpError('User not found', 404);

  if (!user.isDemo && user.passwordHash) {
    const ok = await bcrypt.compare(String(currentPassword ?? ''), user.passwordHash);
    if (!ok) throw new HttpError('Current password is incorrect', 400);
  }

  user.passwordHash = await bcrypt.hash(String(newPassword), 10);
  user.isDemo = false;
  await user.save();

  res.json({ ok: true });
});

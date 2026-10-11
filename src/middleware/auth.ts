import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'hvac-dev-secret-change-in-production';
export const JWT_EXPIRES_IN = '7d';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
}

// Extend Express Request to carry the decoded user
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/** Sign a JWT for a given user. */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * requireAuth middleware — verifies the Bearer token and attaches
 * the decoded payload to `req.user`. Rejects with 401 if missing or invalid.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

/** Like requireAuth, but also requires an admin-role token. */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'No token provided' });
    return;
  }
  try {
    const decoded = jwt.verify(authHeader.slice(7), JWT_SECRET) as JwtPayload;
    if (decoded.role !== 'admin') {
      res.status(403).json({ message: 'Admin access required' });
      return;
    }
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

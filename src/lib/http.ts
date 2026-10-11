import type { NextFunction, Request, Response } from 'express';

/** Error carrying an HTTP status; the central handler serializes it as { message }. */
export class HttpError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
  }
}

/** Wrap an async route so thrown/rejected errors reach the error middleware. */
export const ah =
  (fn: (req: Request, res: Response, next: NextFunction) => unknown) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/** Central error handler — matches the { message } shape the app expects. */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const status = err instanceof HttpError ? err.status : 500;
  const message =
    err instanceof Error ? err.message : 'Internal server error';
  if (status >= 500) console.error(err);
  res.status(status).json({ message });
}

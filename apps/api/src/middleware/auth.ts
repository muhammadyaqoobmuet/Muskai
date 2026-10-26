import type { NextFunction, Request, Response } from 'express';
import type { User } from '@prisma/client';
import { readSessionToken } from '../auth/token';
import { AppError } from './error';
import { findUserById } from '../services/user.service';

export const SESSION_COOKIE = 'muskai_session';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Set by requireAuth / optionalAuth when a valid session exists. */
      user?: User;
    }
  }
}

/** Minimal cookie header parser — avoids pulling in cookie-parser. */
export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.cookie;
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return undefined;
}

export function setSessionCookie(res: Response, token: string): void {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30 * 1000,
  });
}

export function clearSessionCookie(res: Response): void {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
}

/**
 * Attaches req.user when a valid session cookie is present. Never rejects —
 * used by public endpoints that still want to personalise the response.
 */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const payload = readSessionToken(readCookie(req, SESSION_COOKIE));
    if (payload) {
      const user = await findUserById(payload.sub);
      if (user) req.user = user;
    }
  } catch {
    // A broken session must never break a public request.
  }
  next();
}

/** Hard gate: 401 unless a valid session cookie is present. */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const payload = readSessionToken(readCookie(req, SESSION_COOKIE));
  if (!payload) {
    next(new AppError(401, 'UNAUTHENTICATED', 'Sign in to continue'));
    return;
  }
  const user = await findUserById(payload.sub);
  if (!user) {
    next(new AppError(401, 'UNAUTHENTICATED', 'Your session has expired — sign in again'));
    return;
  }
  req.user = user;
  next();
}

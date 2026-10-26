import type { Request, Response } from 'express';
import type { User } from '@prisma/client';
import type { LoginInput, RegisterInput } from '@muskai/shared';
import { hashPassword, verifyPassword } from '../auth/password';
import { createSessionToken } from '../auth/token';
import { prisma } from '../db/client';
import { AppError } from '../middleware/error';
import { clearSessionCookie, setSessionCookie } from '../middleware/auth';
import * as users from '../services/user.service';

/** Account creation, login, logout and session introspection. */

export async function register(req: Request, res: Response): Promise<void> {
  const input = req.body as RegisterInput;

  const existing = await users.findUserByEmail(input.email);
  if (existing) {
    throw new AppError(409, 'EMAIL_TAKEN', 'An account with that email already exists');
  }

  const passwordHash = await hashPassword(input.password);
  const user = await users.createUser({
    name: input.name,
    email: input.email,
    passwordHash,
  });

  setSessionCookie(res, createSessionToken(user.id));
  res.status(201).json({ user: users.toUserDTO(user) });
}

export async function login(req: Request, res: Response): Promise<void> {
  const input = req.body as LoginInput;

  const user = await users.findUserByEmail(input.email);
  // Same message for "no such user" and "wrong password" — don't leak which.
  const invalid = new AppError(401, 'INVALID_CREDENTIALS', 'Email or password is incorrect');
  if (!user) throw invalid;

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) throw invalid;

  setSessionCookie(res, createSessionToken(user.id));
  res.json({ user: users.toUserDTO(user) });
}

export async function logout(_req: Request, res: Response): Promise<void> {
  clearSessionCookie(res);
  res.status(204).send();
}

/**
 * GET /api/auth/me — session introspection.
 * Returns 200 with `{ user: null }` for guests so the browser does not log a
 * failed request on every page it loads.
 */
export async function me(req: Request, res: Response): Promise<void> {
  res.json({ user: req.user ? users.toUserDTO(req.user) : null });
}

/** PATCH /api/auth/me — update the display name and bio. */
export async function updateMe(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Not signed in');
  const { name, bio } = req.body as { name?: string; bio?: string | null };

  const updated = await prisma.user.update({
    where: { id: req.user.id },
    data: {
      ...(name ? { name } : {}),
      ...(bio !== undefined ? { bio } : {}),
    },
  });
  res.json({ user: users.toUserDTO(updated as User) });
}

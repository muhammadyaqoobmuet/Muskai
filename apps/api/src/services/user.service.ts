import type { User } from '@prisma/client';
import type { UserDTO } from '@muskai/shared';
import { prisma } from '../db/client';
import { AppError } from '../middleware/error';

/**
 * Users, their public handle and the avatar that goes with them.
 * Handles are derived from the display name and de-duplicated with a numeric
 * suffix, so /u/<handle> is always a stable public URL.
 */

/** Deterministic gradient avatar — no uploads, no external service. */
export function avatarUrl(handle: string): string {
  const seed = Array.from(handle).reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) >>> 0, 7);
  const hue = seed % 360;
  const hue2 = (hue + 42) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="hsl(${hue} 34% 52%)"/><stop offset="100%" stop-color="hsl(${hue2} 28% 38%)"/></linearGradient></defs><rect width="128" height="128" rx="32" fill="url(#g)"/><text x="64" y="80" font-family="system-ui,-apple-system,Segoe UI,Helvetica,Arial,sans-serif" font-size="52" font-weight="600" fill="#ffffff" text-anchor="middle">${initials(handle)}</text></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

function initials(handle: string): string {
  const parts = handle.split(/[._-]+/).filter(Boolean);
  const letters = parts.length >= 2 ? `${parts[0][0]}${parts[1][0]}` : handle.slice(0, 2);
  return letters.toUpperCase();
}

/** "Ada Lovelace" -> "ada-lovelace" */
export function slugify(name: string): string {
  const slug = name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 28);
  return slug || 'creator';
}

/** Find a free handle for `name`, appending -2, -3, … when taken. */
export async function allocateHandle(name: string): Promise<string> {
  const base = slugify(name);
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    const taken = await prisma.user.findUnique({ where: { handle: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export function toUserDTO(user: User): UserDTO {
  return {
    id: user.id,
    name: user.name,
    handle: user.handle,
    email: user.email,
    bio: user.bio,
    avatarUrl: avatarUrl(user.handle),
    createdAt: user.createdAt.toISOString(),
  };
}

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export async function findUserByHandle(handle: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { handle } });
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
}): Promise<User> {
  const handle = await allocateHandle(input.name);
  return prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash: input.passwordHash, handle },
  });
}

export async function requireUserByEmail(email: string): Promise<User> {
  const user = await findUserByEmail(email);
  if (!user) throw new AppError(404, 'USER_NOT_FOUND', 'No account with that email');
  return user;
}

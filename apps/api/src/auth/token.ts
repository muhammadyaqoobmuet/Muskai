import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from '../config';

/**
 * Stateless session tokens: `base64url(payload).base64url(hmac)` — a compact
 * JWT-shaped token signed with HMAC-SHA256. No dependency needed, and the
 * browser only ever sees an opaque httpOnly cookie.
 */
const TOKEN_TTL_SEC = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  /** User id. */
  sub: string;
  /** Issued-at (seconds). */
  iat: number;
  /** Expiry (seconds). */
  exp: number;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input).toString('base64url');
}

function sign(data: string): string {
  return createHmac('sha256', config.sessionSecret).update(data).digest('base64url');
}

export function createSessionToken(userId: string): string {
  const now = Math.floor(Date.now() / 1000);
  const payload: SessionPayload = { sub: userId, iat: now, exp: now + TOKEN_TTL_SEC };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

/** Verify + decode. Returns null for anything malformed, forged or expired. */
export function readSessionToken(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;

  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = sign(body);

  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as SessionPayload;
    if (!payload.sub || typeof payload.exp !== 'number') return null;
    if (payload.exp * 1000 <= Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

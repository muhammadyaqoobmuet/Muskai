import { z } from 'zod';

/**
 * Accounts, sessions and the public "reel" surface (the reels users create
 * and share with each other). Kept here so the API and the web app can never
 * disagree about the contract.
 */

/** Display name rules — also enforced server-side before hitting the DB. */
export const NAME_MIN = 2;
export const NAME_MAX = 40;

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 200;

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(NAME_MIN, `Name must be at least ${NAME_MIN} characters`)
    .max(NAME_MAX, `Name must be at most ${NAME_MAX} characters`),
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z
    .string()
    .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
    .max(PASSWORD_MAX),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

/** The public shape of a user. Never includes the password hash. */
export interface UserDTO {
  id: string;
  name: string;
  /** URL-safe handle derived from the name, unique per user. */
  handle: string;
  email: string;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

/** The author block embedded in public reel payloads. */
export interface AuthorDTO {
  id: string;
  name: string;
  handle: string;
  avatarUrl: string | null;
}

/**
 * A published generation as the community sees it: the media plus the
 * social layer (author, likes, views).
 */
export interface ReelDTO {
  id: string;
  prompt: string;
  mode: GenerationModeLike;
  aspectRatio: AspectRatioLike;
  targetDurationSec: number;
  modelsUsed: string[];
  status: string;
  outputUrl: string | null;
  posterUrl: string | null;
  author: AuthorDTO;
  likeCount: number;
  likedByMe: boolean;
  viewCount: number;
  createdAt: string;
  publishedAt: string | null;
}

// Local aliases so this module stays free of import cycles with schemas.ts.
type GenerationModeLike = 'TEXT_TO_VIDEO' | 'IMAGE_TO_VIDEO' | 'KEYFRAMES' | 'REFERENCE' | 'EDIT';
type AspectRatioLike = '9:16' | '16:9' | '1:1';

/** Public feed query — paging is offset based, simple and good enough here. */
export const reelFeedQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(48).default(12),
  offset: z.coerce.number().int().min(0).default(0),
  /** Filter to a single author handle. */
  handle: z.string().trim().min(1).optional(),
});

export type ReelFeedQuery = z.infer<typeof reelFeedQuerySchema>;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(NAME_MIN).max(NAME_MAX).optional(),
  bio: z.string().trim().max(280, 'Bio must be at most 280 characters').nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

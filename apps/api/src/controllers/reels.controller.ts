import type { Request, Response } from 'express';
import { reelFeedQuerySchema } from '@muskai/shared';
import { AppError } from '../middleware/error';
import * as reels from '../services/reel.service';

/** The public community feed, reel detail, likes and creator profiles. */

export async function feed(req: Request, res: Response): Promise<void> {
  const query = reelFeedQuerySchema.parse(req.query);
  const viewerId = req.user?.id ?? null;
  res.json(await reels.listPublicReels(query, viewerId));
}

export async function detail(req: Request, res: Response): Promise<void> {
  const viewerId = req.user?.id ?? null;
  res.json(await reels.getPublicReel(req.params.id as string, viewerId));
}

export async function like(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Sign in to like reels');
  res.json(await reels.toggleLike(req.params.id as string, req.user.id));
}

export async function profile(req: Request, res: Response): Promise<void> {
  res.json(await reels.getProfile(req.params.handle as string));
}

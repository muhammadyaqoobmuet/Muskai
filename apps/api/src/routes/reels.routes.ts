import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import * as controller from '../controllers/reels.controller';
import { optionalAuth, requireAuth } from '../middleware/auth';

type AsyncHandler = (req: Request, res: Response) => Promise<void>;

const asyncHandler =
  (fn: AsyncHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res).catch(next);
  };

export const reelsRouter = Router();

// Everything under /api/reels is public; the session only personalises it.
reelsRouter.get('/', optionalAuth, asyncHandler(controller.feed));
reelsRouter.get('/:id', optionalAuth, asyncHandler(controller.detail));
reelsRouter.post('/:id/like', requireAuth, asyncHandler(controller.like));

export const usersRouter = Router();

usersRouter.get('/:handle', optionalAuth, asyncHandler(controller.profile));

import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { createGenerationSchema, extendGenerationSchema, publishGenerationSchema } from '@muskai/shared';
import * as controller from '../controllers/generations.controller';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

type AsyncHandler = (req: Request, res: Response) => Promise<void>;

/** Wrap async handlers so rejections reach the central error handler. */
const asyncHandler =
  (fn: AsyncHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res).catch(next);
  };

export const generationsRouter = Router();

// Every generation belongs to a signed-in creator.
generationsRouter.use(requireAuth);

generationsRouter.post('/', validateBody(createGenerationSchema), asyncHandler(controller.create));
generationsRouter.get('/', asyncHandler(controller.list));
generationsRouter.get('/:id', asyncHandler(controller.getById));
generationsRouter.post('/:id/extend', validateBody(extendGenerationSchema), asyncHandler(controller.extend));
generationsRouter.post('/:id/publish', validateBody(publishGenerationSchema), asyncHandler(controller.publish));
generationsRouter.delete('/:id', asyncHandler(controller.remove));

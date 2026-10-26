import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import { loginSchema, registerSchema, updateProfileSchema } from '@muskai/shared';
import * as controller from '../controllers/auth.controller';
import { optionalAuth, requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';

type AsyncHandler = (req: Request, res: Response) => Promise<void>;

const asyncHandler =
  (fn: AsyncHandler) =>
  (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res).catch(next);
  };

export const authRouter = Router();

authRouter.post('/register', validateBody(registerSchema), asyncHandler(controller.register));
authRouter.post('/login', validateBody(loginSchema), asyncHandler(controller.login));
authRouter.post('/logout', asyncHandler(controller.logout));
authRouter.get('/me', optionalAuth, asyncHandler(controller.me));
authRouter.patch('/me', requireAuth, validateBody(updateProfileSchema), asyncHandler(controller.updateMe));

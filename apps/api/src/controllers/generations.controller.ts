import type { Request, Response } from 'express';
import type { CreateGenerationInput } from '@muskai/shared';
import { AppError } from '../middleware/error';
import * as generations from '../services/generation.service';

/** Thin HTTP layer over the generation service — no business logic here. */

function ownerId(req: Request): string {
  if (!req.user) throw new AppError(401, 'UNAUTHENTICATED', 'Sign in to continue');
  return req.user.id;
}

export async function create(req: Request, res: Response): Promise<void> {
  const input = req.body as CreateGenerationInput;
  const dto = await generations.createGeneration(input, ownerId(req));
  res.status(202).json(dto);
}

export async function list(req: Request, res: Response): Promise<void> {
  res.json(await generations.listGenerations(ownerId(req)));
}

export async function getById(req: Request, res: Response): Promise<void> {
  res.json(await generations.getGeneration(req.params.id as string, ownerId(req)));
}

export async function extend(req: Request, res: Response): Promise<void> {
  const dto = await generations.extendGeneration(req.params.id as string, ownerId(req));
  res.status(202).json(dto);
}

export async function remove(req: Request, res: Response): Promise<void> {
  await generations.deleteGeneration(req.params.id as string, ownerId(req));
  res.status(204).send();
}

/** POST /api/generations/:id/publish — share the reel publicly. */
export async function publish(req: Request, res: Response): Promise<void> {
  const { published } = req.body as { published: boolean };
  const dto = await generations.setPublished(
    req.params.id as string,
    ownerId(req),
    Boolean(published),
  );
  res.json(dto);
}

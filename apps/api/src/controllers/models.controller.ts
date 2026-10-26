import type { Request, Response } from 'express';
import { listModelsWithUsage } from '../services/model-router';

export async function list(_req: Request, res: Response): Promise<void> {
  res.json(await listModelsWithUsage());
}

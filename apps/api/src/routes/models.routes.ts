import { Router } from 'express';
import * as controller from '../controllers/models.controller';

export const modelsRouter = Router();

modelsRouter.get('/', (req, res, next) => {
  controller.list(req, res).catch(next);
});

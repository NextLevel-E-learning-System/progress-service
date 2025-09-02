import { Router } from 'express';
import { createInscricaoHandler, getInscricaoHandler, patchProgressoHandler } from '../controllers/progressController.js';
export const progressRouter = Router();
progressRouter.post('/inscricoes', createInscricaoHandler);
progressRouter.get('/inscricoes/:id', getInscricaoHandler);
progressRouter.patch('/inscricoes/:id/progresso', patchProgressoHandler);

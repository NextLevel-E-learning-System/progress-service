import { Router } from 'express';
import { createInscricaoHandler, getInscricaoHandler, patchProgressoHandler, completeModuleHandler, listInscricoesUsuarioHandler } from '../controllers/progressController.js';
import { listCertificatesHandler, issueCertificateHandler } from '../controllers/certificateController.js';
import { listTracksHandler, userTrackProgressHandler } from '../controllers/trackController.js';
export const progressRouter = Router();
progressRouter.post('/inscricoes', createInscricaoHandler);
progressRouter.get('/inscricoes/:id', getInscricaoHandler);
progressRouter.get('/inscricoes/usuario/:userId', listInscricoesUsuarioHandler);
progressRouter.patch('/inscricoes/:id/progresso', patchProgressoHandler);
progressRouter.post('/inscricoes/:id/modulos/:moduloId/concluir', completeModuleHandler);
// Certificates (placeholder)
progressRouter.get('/certificates/user/:userId', listCertificatesHandler);
progressRouter.post('/certificates/enrollment/:enrollmentId', issueCertificateHandler);
// Learning tracks (placeholder)
progressRouter.get('/tracks', listTracksHandler);
progressRouter.get('/tracks/user/:userId', userTrackProgressHandler);

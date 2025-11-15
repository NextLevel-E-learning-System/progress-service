import { Router } from 'express';
import { createInscricaoHandler, listInscricoesUsuarioHandler, startModuleHandler, completeModuleNewHandler, listInscricoesCursoHandler } from '../controllers/progressController.js';
import { listCertificatesHandler, issueCertificateHandler, certificatePdfHandler } from '../controllers/certificateController.js';
import {
  listarModulosComProgressoHandler
} from '../controllers/progressoCompostoController.js';
export const progressRouter = Router();

progressRouter.post('/inscricoes', createInscricaoHandler); 
progressRouter.get('/inscricoes', listInscricoesCursoHandler);
progressRouter.get('/inscricoes/usuario/:userId', listInscricoesUsuarioHandler);

progressRouter.get('/inscricoes/:id/modulos-progresso', listarModulosComProgressoHandler);

progressRouter.post('/inscricoes/:inscricaoId/modulos/:moduloId/iniciar', startModuleHandler);
progressRouter.patch('/inscricoes/:inscricaoId/modulos/:moduloId/concluir', completeModuleNewHandler);

progressRouter.get('/certificates/user/:userId', listCertificatesHandler);
progressRouter.post('/certificates/enrollment/:enrollmentId', issueCertificateHandler);
progressRouter.get('/certificates/enrollment/:enrollmentId/pdf', certificatePdfHandler);

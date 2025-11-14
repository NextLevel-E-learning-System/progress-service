import { Router } from 'express';
import { createInscricaoHandler, patchProgressoHandler, listInscricoesUsuarioHandler, startModuleHandler, completeModuleNewHandler, listModuleProgressHandler, listInscricoesCursoHandler } from '../controllers/progressController.js';
import { listCertificatesHandler, issueCertificateHandler, certificatePdfHandler } from '../controllers/certificateController.js';
import {
  listarModulosComProgressoHandler
} from '../controllers/progressoCompostoController.js';
export const progressRouter = Router();

progressRouter.post('/inscricoes', createInscricaoHandler); 
progressRouter.get('/inscricoes', listInscricoesCursoHandler); // NOVO: Listar por curso
progressRouter.get('/inscricoes/usuario/:userId', listInscricoesUsuarioHandler);
progressRouter.patch('/inscricoes/:id/progresso', patchProgressoHandler);

// Rotas de módulos compostos (novo sistema modular)
progressRouter.get('/inscricoes/:id/modulos-progresso', listarModulosComProgressoHandler);

// Novos endpoints para progresso de módulo (sistema antigo - mantido para compatibilidade)
progressRouter.get('/inscricoes/:inscricaoId/modulos', listModuleProgressHandler);
progressRouter.post('/inscricoes/:inscricaoId/modulos/:moduloId/iniciar', startModuleHandler);
progressRouter.patch('/inscricoes/:inscricaoId/modulos/:moduloId/concluir', completeModuleNewHandler);

// Certificates - PROTEGIDO (exceto validação)
progressRouter.get('/certificates/user/:userId', listCertificatesHandler);
progressRouter.post('/certificates/enrollment/:enrollmentId', issueCertificateHandler);
progressRouter.get('/certificates/enrollment/:enrollmentId/pdf', certificatePdfHandler);

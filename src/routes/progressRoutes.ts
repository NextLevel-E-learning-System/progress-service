import { Router } from 'express';
import { withClient } from '../db.js';
import { createInscricaoHandler, getInscricaoHandler, patchProgressoHandler, completeModuleHandler, listInscricoesUsuarioHandler, startModuleHandler, completeModuleNewHandler } from '../controllers/progressController.js';
import { listCertificatesHandler, issueCertificateHandler, certificatePdfHandler } from '../controllers/certificateController.js';
import { listTracksHandler, userTrackProgressHandler } from '../controllers/trackController.js';
export const progressRouter = Router();

progressRouter.post('/inscricoes', createInscricaoHandler); 
progressRouter.get('/inscricoes/:id', getInscricaoHandler);
progressRouter.get('/inscricoes/usuario/:userId', listInscricoesUsuarioHandler);
progressRouter.patch('/inscricoes/:id/progresso', patchProgressoHandler);

// Novos endpoints para progresso de módulo
progressRouter.post('/inscricoes/:inscricaoId/modulos/:moduloId/iniciar', startModuleHandler);
progressRouter.patch('/inscricoes/:inscricaoId/modulos/:moduloId/concluir', completeModuleNewHandler);

// Manter endpoint antigo para compatibilidade
progressRouter.post('/inscricoes/:id/modulos/:moduloId/concluir', completeModuleHandler);

// Certificates - PROTEGIDO (exceto validação)
progressRouter.get('/certificates/user/:userId', listCertificatesHandler);
progressRouter.post('/certificates/enrollment/:enrollmentId', issueCertificateHandler);
progressRouter.get('/certificates/enrollment/:enrollmentId/pdf', certificatePdfHandler);

// Validação pública (query: hash) - PÚBLICO
progressRouter.get('/certificates/validate/:code', async (req,res,next)=>{
  try {
    const { code } = req.params;
    const { hash } = req.query as { hash?:string };
    if(!hash) return res.status(400).json({ erro:'hash_ausente', mensagem:'Parâmetro hash ausente' });
    const cert = await withClient(async c=>{
      const r = await c.query('select codigo_certificado, hash_validacao, funcionario_id, curso_id, data_emissao from progress_service.certificados where codigo_certificado=$1',[code]);
      return r.rows[0];
    });
    if(!cert) return res.status(404).json({ erro:'certificado_nao_encontrado', mensagem:'Certificado não encontrado' });
    const valido = cert.hash_validacao === hash;
    return res.json({ certificado:{ codigo: cert.codigo_certificado, curso_id: cert.curso_id, funcionario_id: cert.funcionario_id, data_emissao: cert.data_emissao, valido }, mensagem: 'Validação realizada' });
  } catch(e){ next(e); }
});

// Learning tracks - listar público, progresso pessoal protegido
progressRouter.get('/tracks', listTracksHandler); // PÚBLICO
progressRouter.get('/tracks/user/:userId', userTrackProgressHandler);

import { Router } from 'express';
import { withClient } from '../db.js';
import { createInscricaoHandler, getInscricaoHandler, patchProgressoHandler, completeModuleHandler, listInscricoesUsuarioHandler } from '../controllers/progressController.js';
import { listCertificatesHandler, issueCertificateHandler, certificatePdfHandler } from '../controllers/certificateController.js';
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
progressRouter.get('/certificates/enrollment/:enrollmentId/pdf', certificatePdfHandler);
// Validação pública (query: hash)
progressRouter.get('/certificates/validate/:code', async (req,res,next)=>{
	try {
		const { code } = req.params;
		const { hash } = req.query as { hash?:string };
		if(!hash) return res.status(400).json({ message:'hash ausente' });
		const cert = await withClient(async c=>{
			const r = await c.query('select codigo_certificado, hash_validacao, funcionario_id, curso_id, data_emissao from progress_service.certificados where codigo_certificado=$1',[code]);
			return r.rows[0];
		});
		if(!cert) return res.status(404).json({ message:'certificado_nao_encontrado' });
		const valido = cert.hash_validacao === hash;
		res.json({ valido, codigo: cert.codigo_certificado, curso_id: cert.curso_id, funcionario_id: cert.funcionario_id, data_emissao: cert.data_emissao });
	} catch(e){ next(e); }
});
// Learning tracks (placeholder)
progressRouter.get('/tracks', listTracksHandler);
progressRouter.get('/tracks/user/:userId', userTrackProgressHandler);

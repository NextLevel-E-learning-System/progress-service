import { Request, Response, NextFunction } from 'express';
import { getUserCertificates, getOrCreateCertificate } from '../services/certificateService.js';
import { gerarPdfCertificado } from '../utils/certificatePdf.js';
import { getCourse, getUser } from '../utils/serviceClients.js';
import { withClient } from '../db.js';
export async function listCertificatesHandler(req:Request,res:Response,next:NextFunction){ try { const r = await getUserCertificates(req.params.userId); res.json(r);} catch(e){ next(e);} }
export async function issueCertificateHandler(req:Request,res:Response,next:NextFunction){ try { const r = await getOrCreateCertificate(req.params.enrollmentId); res.status(201).json(r);} catch(e){ next(e);} }
export async function certificatePdfHandler(req:Request,res:Response,next:NextFunction){
	try {
		const cert = await getOrCreateCertificate(req.params.enrollmentId);
		// Recupera info básica do curso e usuário (nomes) - placeholders pois dependeria de join cross-service
		const nomeUsuario = (await getUser(cert.funcionario_id))?.nome || 'Funcionário';
		const tituloCurso = (await getCourse(cert.curso_id))?.titulo || 'Curso';
		const pdf = await gerarPdfCertificado({
			tituloCurso,
			nomeUsuario,
			codigoCertificado: cert.codigo_certificado ?? cert['codigo_certificado'] ?? 'N/A',
			hashValidacao: cert.hash_validacao ?? cert['hash_validacao'] ?? 'hash',
			empresa: 'NextLevel',
			instrutor: 'Instrutor'
		});
		// Atualiza url_pdf se ainda null (futuro: salvar em storage externo)
		if(!cert.url_pdf){
			await withClient(c=>c.query('update progress_service.certificados set url_pdf=$2 where id=$1',[cert.id, null]));
		}
		res.setHeader('Content-Type','application/pdf');
		res.setHeader('Content-Disposition',`inline; filename="certificado-${cert.codigo_certificado}.pdf"`);
		return res.send(pdf);
	} catch(e){ next(e); }
}

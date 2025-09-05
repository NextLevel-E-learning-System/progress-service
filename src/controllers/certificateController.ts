import { Request, Response, NextFunction } from 'express';
import { getUserCertificates, getOrCreateCertificate } from '../services/certificateService.js';
import { gerarPdfCertificado } from '../utils/certificatePdf.js';
import { uploadObject, presign } from '../utils/storageClient.js';
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
		// Upload se ainda não existir qualquer storage_key (usando coluna url_pdf como placeholder de key)
		let key = cert.storage_key || cert.url_pdf; // preferir nova coluna
		const bucket = process.env.STORAGE_BUCKET_CERTIFICADOS || 'certificates';
		if(!key){
			key = `certificates/${cert.codigo_certificado}.pdf`;
			await uploadObject(bucket, key, pdf, 'application/pdf');
			await withClient(c=>c.query('update progress_service.certificados set storage_key=$2 where id=$1',[cert.id, key]));
		}
		const signed = await presign(bucket, key, 300);
		return res.json({ downloadUrl: signed, key, codigo: cert.codigo_certificado });
	} catch(e){ next(e); }
}

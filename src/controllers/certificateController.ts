import { Request, Response } from 'express';
import { getUserCertificates, getOrCreateCertificate } from '../services/certificateService.js';
import { gerarPdfCertificado } from '../utils/certificatePdf.js';
import { uploadObject, presign } from '../utils/storageClient.js';
import { getCourse, getUser } from '../utils/serviceClients.js';
import { withClient } from '../db.js';

export async function listCertificatesHandler(req:Request,res:Response){
	const r = await getUserCertificates(req.params.userId);
	return res.json(r);
}

export async function issueCertificateHandler(req:Request,res:Response){
	const r = await getOrCreateCertificate(req.params.enrollmentId);
	if('erro' in r) return res.status(r.erro === 'inscricao_nao_encontrada' ? 404 : 409).json(r);
	return res.status(201).json(r);
}

export async function certificatePdfHandler(req:Request,res:Response){
	const r = await getOrCreateCertificate(req.params.enrollmentId);
	if('erro' in r) return res.status(r.erro === 'inscricao_nao_encontrada' ? 404 : 409).json(r);
	const cert = r.certificado;
	
	// Buscar dados reais do usuário, curso e instrutor
	const usuario = await getUser(cert.funcionario_id);
	const curso = await getCourse(cert.curso_id);
	const nomeUsuario = usuario?.nome || 'Funcionário';
	const tituloCurso = curso?.titulo || 'Curso';
	const cargaHoraria = curso?.duracao_estimada || undefined;
	
	// Buscar nome do instrutor se existir instrutor_id no curso
	let nomeInstrutor = 'Instrutor NextLevel';
	if (curso?.instrutor_id) {
		const instrutor = await getUser(curso.instrutor_id);
		nomeInstrutor = instrutor?.nome || nomeInstrutor;
	}
	
	const pdf = await gerarPdfCertificado({
		tituloCurso,
		nomeUsuario,
		codigoCertificado: cert.codigo_certificado,
		hashValidacao: cert.hash_validacao,
		empresa: 'NextLevel E-Learning',
		instrutor: nomeInstrutor,
		cargaHoraria,
		dataConclusao: cert.data_emissao.toString(),
		localidade: 'São Paulo, Brasil'
	});
	
	// Gerar storage_key seguindo padrão: {env}/certificates/codigo.pdf
	const envPrefix = process.env.STORAGE_ENV_PREFIX || 'dev';
	let key = cert.storage_key;
	const bucket = process.env.STORAGE_BUCKET_CERTIFICADOS || 'nextlevel-elearning-prod';
	
	if(!key){
		key = `${envPrefix}/certificates/${cert.codigo_certificado}.pdf`;
		await uploadObject(bucket, key, pdf, 'application/pdf');
		await withClient(c=>c.query('update progress_service.certificados set storage_key=$2 where id=$1',[cert.id, key]));
	}
	
	const signed = await presign(bucket, key, 300);
	return res.json({ downloadUrl: signed, key, codigo: cert.codigo_certificado, mensagem: 'PDF gerado com sucesso' });
}

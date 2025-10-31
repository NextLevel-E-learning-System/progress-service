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
		localidade: 'Curitiba - PR, Brasil'
	});
	
	// Gerar storage_key seguindo padrão: certificates/codigo.pdf
	// O uploadObject vai adicionar o prefixo de ambiente automaticamente
	let key = cert.storage_key;
	const bucket = process.env.STORAGE_BUCKET_CERTIFICADOS || 'nextlevel-elearning-prod';
	
	if(!key){
		// NÃO incluir o envPrefix aqui - o uploadObject adiciona automaticamente!
		key = `certificates/${cert.codigo_certificado}.pdf`;
		console.log(`📤 [certificatePdfHandler] Fazendo upload do certificado para S3...`);
		console.log(`   Bucket: ${bucket}`);
		console.log(`   Key (sem prefixo): ${key}`);
		
		const uploadResult = await uploadObject({ bucket, key, body: pdf, contentType: 'application/pdf' });
		console.log(`✅ [certificatePdfHandler] Upload concluído com sucesso!`);
		console.log(`   Key final (com prefixo): ${uploadResult.key}`);
		
		// Salvar a key COM o prefixo de ambiente que foi retornada pelo uploadObject
		await withClient(c=>c.query('update progress_service.certificados set storage_key=$2 where id=$1',[cert.id, uploadResult.key]));
		console.log(`💾 [certificatePdfHandler] storage_key salvo no banco de dados: ${uploadResult.key}`);
		
		// Atualizar a variável key para o presign usar a key correta
		key = uploadResult.key;
	} else {
		console.log(`♻️ [certificatePdfHandler] Certificado já existe no storage: ${key}`);
	}
	
	console.log(`🔐 [certificatePdfHandler] Gerando presigned URL...`);
	const signed = await presign(bucket, key, 300);
	
	if (!signed) {
		console.error(`❌ [certificatePdfHandler] Falha ao gerar presigned URL!`);
		console.error(`   Bucket: ${bucket}`);
		console.error(`   Key: ${key}`);
	} else {
		console.log(`✅ [certificatePdfHandler] Presigned URL gerado com sucesso`);
	}
	
	return res.json({ downloadUrl: signed, key, codigo: cert.codigo_certificado, mensagem: 'PDF gerado com sucesso' });
}

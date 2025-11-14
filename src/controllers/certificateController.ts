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
	const inscricao = r.inscricao;
	
	// Buscar dados reais do usuário, curso e instrutor
	const usuario = await getUser(cert.funcionario_id);
	const cursoResponse = await getCourse(cert.curso_id);
	
	// O course-service retorna { curso: {...} } então precisamos acessar .curso
	const curso = cursoResponse?.curso || cursoResponse;
	
	const nomeUsuario = usuario?.nome || 'Funcionário';
	const tituloCurso = curso?.titulo || 'Curso';
	const cargaHoraria = curso?.duracao_estimada || undefined;
	
	// Buscar nome do instrutor - primeiro tenta instrutor_nome, depois busca pelo ID
	let nomeInstrutor = 'Instrutor NextLevel';
	
	if (curso?.instrutor_nome) {
		nomeInstrutor = curso.instrutor_nome;
	} else if (curso?.instrutor_id) {
		const instrutor = await getUser(curso.instrutor_id);
		nomeInstrutor = instrutor?.nome || nomeInstrutor;
	}
	
	const pdfOptions = {
		tituloCurso,
		nomeUsuario,
		codigoCertificado: cert.codigo_certificado,
		hashValidacao: cert.hash_validacao,
		empresa: 'NextLevel E-Learning',
		instrutor: nomeInstrutor,
		cargaHoraria,
		// USAR DATA DE CONCLUSÃO DO CURSO, NÃO DATA DE EMISSÃO DO CERTIFICADO!
		dataConclusao: inscricao?.data_conclusao?.toString() || cert.data_emissao.toString(),
		localidade: 'Curitiba'
	};
	
	const pdf = await gerarPdfCertificado(pdfOptions);
	
	// Gerar storage_key seguindo padrão: certificates/codigo.pdf
	// O uploadObject vai adicionar o prefixo de ambiente automaticamente
	let key = cert.storage_key;
	const bucket = process.env.STORAGE_BUCKET_CERTIFICADOS || 'nextlevel-elearning-prod';
	
	if(!key){
		// NÃO incluir o envPrefix aqui - o uploadObject adiciona automaticamente!
		key = `certificates/${cert.codigo_certificado}.pdf`;
		
		const uploadResult = await uploadObject({ bucket, key, body: pdf, contentType: 'application/pdf' });
		
		// Salvar a key COM o prefixo de ambiente que foi retornada pelo uploadObject
		await withClient(c=>c.query('update progress_service.certificados set storage_key=$2 where id=$1',[cert.id, uploadResult.key]));
		
		// Atualizar a variável key para o presign usar a key correta
		key = uploadResult.key;
	}
	
	const signed = await presign(bucket, key, 300);
	
	if (!signed) {
		return res.status(500).json({ erro: 'falha_presigned_url', mensagem: 'Falha ao gerar URL de download' });
	}
	
	return res.json({ downloadUrl: signed, key, codigo: cert.codigo_certificado, mensagem: 'PDF gerado com sucesso' });
}

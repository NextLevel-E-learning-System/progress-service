import { listCertificatesByUser, issueCertificate, findCertificateByUserCourse } from '../repositories/certificateRepository.js';
import { findInscricao } from '../repositories/progressRepository.js';
import { gerarPdfCertificado } from '../utils/certificatePdf.js';
import { uploadObject } from '../utils/storageClient.js';
import { getCourse, getUser } from '../utils/serviceClients.js';
import { withClient } from '../db.js';

export async function getUserCertificates(userId:string){
	const certs = await listCertificatesByUser(userId);
	return { items: certs, mensagem: 'Certificados listados com sucesso' };
}

export async function ensureCertificateForEnrollment(enrollmentId:string){
	const ins = await findInscricao(enrollmentId);
	if(!ins) return { erro:'inscricao_nao_encontrada', mensagem:'Inscrição não encontrada' };
	if(ins.status !== 'CONCLUIDO') return { erro:'curso_nao_concluido', mensagem:'Curso ainda não concluído' };
	
	const cert = await issueCertificate(enrollmentId, ins.funcionario_id, ins.curso_id);
	
	// Gerar PDF e fazer upload se ainda não tiver storage_key
	if (!cert.storage_key) {
		try {
			// Buscar dados para gerar o PDF
			const usuario = await getUser(cert.funcionario_id);
			const cursoResponse = await getCourse(cert.curso_id);
			const curso = cursoResponse?.curso || cursoResponse;
			
			const nomeUsuario = usuario?.nome || 'Funcionário';
			const tituloCurso = curso?.titulo || 'Curso';
			const cargaHoraria = curso?.duracao_estimada || undefined;
			
			// Buscar nome do instrutor
			let nomeInstrutor = 'Instrutor NextLevel';
			if (curso?.instrutor_nome) {
				nomeInstrutor = curso.instrutor_nome;
			} else if (curso?.instrutor_id) {
				const instrutor = await getUser(curso.instrutor_id);
				nomeInstrutor = instrutor?.nome || nomeInstrutor;
			}
			
			// Gerar PDF
			const pdfOptions = {
				tituloCurso,
				nomeUsuario,
				codigoCertificado: cert.codigo_certificado,
				hashValidacao: cert.hash_validacao,
				empresa: 'NextLevel E-Learning',
				instrutor: nomeInstrutor,
				cargaHoraria,
				dataConclusao: ins.data_conclusao?.toString() || cert.data_emissao.toString(),
				localidade: 'Curitiba'
			};
			
			const pdf = await gerarPdfCertificado(pdfOptions);
			
			// Upload para S3
			const bucket = process.env.STORAGE_BUCKET_CERTIFICADOS || 'nextlevel-elearning-prod';
			const key = `certificates/${cert.codigo_certificado}.pdf`;
			const uploadResult = await uploadObject({ bucket, key, body: pdf, contentType: 'application/pdf' });
			
			// Atualizar storage_key no banco
			await withClient(c => c.query(
				'UPDATE progress_service.certificados SET storage_key=$2 WHERE id=$1',
				[cert.id, uploadResult.key]
			));
			
			// Atualizar objeto cert com a key
			cert.storage_key = uploadResult.key;
		} catch (error) {
			// Log erro mas não falha - certificado foi criado, PDF pode ser gerado depois
			console.error('Erro ao gerar PDF automaticamente:', error);
		}
	}
	
	return { certificado: cert, inscricao: ins, mensagem: 'Certificado emitido com sucesso' };
}

export async function getOrCreateCertificate(enrollmentId:string){
  const ins = await findInscricao(enrollmentId);
  if(!ins) return { erro:'inscricao_nao_encontrada', mensagem:'Inscrição não encontrada' };
  const existing = await findCertificateByUserCourse(ins.funcionario_id, ins.curso_id);
  if(existing) return { certificado: existing, inscricao: ins, mensagem: 'Certificado recuperado com sucesso' };
  return ensureCertificateForEnrollment(enrollmentId);
}

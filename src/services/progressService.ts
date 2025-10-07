import { insertInscricao, findInscricao, updateProgresso, completeModuleDb, CompleteResult, listInscricoesByUser, findActiveInscricaoByUserCourse } from '../repositories/progressRepository.js';
import { createInscricaoSchema } from '../validation/progressSchemas.js';
import { z } from 'zod';
type CreateInscricaoInput = z.infer<typeof createInscricaoSchema>;
import { publishEvent } from '../events/publisher.js';
import { ModuleCompletedPayload, CourseCompletedPayload, CertificateIssuedPayload } from '../events/contracts.js';
import { issueCertificate } from '../repositories/certificateRepository.js';

export async function createInscricao(d:CreateInscricaoInput){ 
	// Verifica duplicidade de inscrição ativa
	const existente = await findActiveInscricaoByUserCourse(d.funcionario_id, d.curso_id);
	if(existente){
		return { erro:'inscricao_duplicada', mensagem:'Usuário já possui inscrição ativa neste curso', inscricao: existente };
	}
	const inscricao = await insertInscricao(d); 
	return inscricao; 
}

export async function getInscricao(id:string){ 
	const i = await findInscricao(id); 
	if(!i) return { erro:'nao_encontrado', mensagem:'Inscrição não encontrada' };
	return { inscricao: i, mensagem: 'Inscrição recuperada com sucesso' }; 
}

export async function patchProgresso(id:string, valor:number){ 
	const up = await updateProgresso(id, valor); 
	if(!up) return { erro:'nao_encontrado', mensagem:'Inscrição não encontrada' };
	return { inscricao: up, mensagem: 'Progresso atualizado com sucesso' }; 
}

export async function completeModule(inscricaoId:string, moduloId:string){
	const r = await completeModuleDb(inscricaoId, moduloId);
	if(!r) return { erro:'nao_encontrado', mensagem:'Inscrição não encontrada' };
	await emitModuleCompleted(r);
	if (r.concluido) await emitCourseCompleted(r);
	return { resultado: r, mensagem: r.concluido? 'Módulo concluído e curso finalizado' : 'Módulo concluído' };
}

export async function listInscricoesUsuario(userId:string){
	const lista = await listInscricoesByUser(userId);
	return lista;
}

async function emitModuleCompleted(r: CompleteResult){
	if(!r.funcionario_id || !r.curso_id) return;
	const payload: ModuleCompletedPayload = {
		enrollmentId: r.inscricao_id,
		courseId: r.curso_id,
		userId: r.funcionario_id,
		moduleId: r.modulo_id,
		progressPercent: r.progresso_percentual,
		completedCourse: r.concluido
	};
	await publishEvent({ type: 'course.module.completed.v1', source: 'progress-service', payload });
}

async function emitCourseCompleted(r: CompleteResult){
	if(!r.funcionario_id || !r.curso_id) return;
	const payload: CourseCompletedPayload = {
		enrollmentId: r.inscricao_id,
		courseId: r.curso_id,
		userId: r.funcionario_id,
		totalProgress: 100
	};
	await publishEvent({ type: 'course.completed.v1', source: 'progress-service', payload });
	// Emissão automática de certificado (ignora erro para não quebrar fluxo principal)
	try {
		const cert = await issueCertificate(r.inscricao_id, r.funcionario_id, r.curso_id);
		const certEvt: CertificateIssuedPayload = {
			courseId: r.curso_id,
			userId: r.funcionario_id,
			certificateCode: cert.codigo_certificado,
			issuedAt: (cert.data_emissao instanceof Date ? cert.data_emissao : new Date(cert.data_emissao)).toISOString(),
			storageKey: cert.storage_key || cert.url_pdf,
			verificationHashFragment: cert.hash_validacao.slice(0,16)
		};
		await publishEvent({ type: 'certificate.issued.v1', source: 'progress-service', payload: certEvt });
	} catch(e){ /* log futuro */ }
}

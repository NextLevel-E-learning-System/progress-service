import { insertInscricao, findInscricao, updateProgresso, completeModuleDb, CompleteResult, listInscricoesByUser, findActiveInscricaoByUserCourse, startModule, completeModuleNew, checkCoursePrerequisites, listModuleProgress } from '../repositories/progressRepository.js';
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
		return { erro:'inscricao_duplicada', mensagem:'Usuário já possui inscrição ativa ou concluída neste curso', inscricao: existente };
	}
	
	// Verifica pré-requisitos do curso
	const preReqCheck = await checkCoursePrerequisites(d.funcionario_id, d.curso_id);
	if(!preReqCheck){
		return { erro:'curso_nao_encontrado', mensagem:'Curso não encontrado' };
	}
	if(!preReqCheck.atendidos){
		return { 
			erro:'pre_requisitos_nao_atendidos', 
			mensagem:'Pré-requisitos do curso não foram atendidos', 
			pendentes: preReqCheck.pendentes 
		};
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
	if (r.concluido) await emitCourseCompleted(r);
	return { resultado: r, mensagem: r.concluido? 'Módulo concluído e curso finalizado' : 'Módulo concluído' };
}

export async function listInscricoesUsuario(userId:string){
	const lista = await listInscricoesByUser(userId);
	return lista;
}

export async function listModuleProgressService(inscricaoId: string) {
	const progress = await listModuleProgress(inscricaoId);
	return progress;
}

export async function listCourseEnrollmentsService(cursoId: string) {
	const { withClient } = await import('../db.js');
	
	return withClient(async (client) => {
		const result = await client.query(`
			SELECT 
				i.id,
				i.funcionario_id,
				i.progresso_percentual as progresso,
				i.status,
				i.data_inscricao,
				i.data_conclusao,
				f.nome as funcionario_nome,
				f.email as funcionario_email,
				COUNT(DISTINCT pm.id) FILTER (WHERE pm.data_conclusao IS NOT NULL) as modulos_completos,
				(
					SELECT COUNT(*) 
					FROM course_service.modulos m 
					WHERE m.curso_id = i.curso_id
				) as total_modulos,
				(
					SELECT t.nota_obtida 
					FROM assessment_service.tentativas t
					JOIN assessment_service.avaliacoes a ON a.codigo = t.avaliacao_id
					WHERE t.funcionario_id = i.funcionario_id 
					AND a.curso_id = i.curso_id
					AND t.status IN ('APROVADO', 'REPROVADO')
					ORDER BY t.nota_obtida DESC NULLS LAST
					LIMIT 1
				) as nota_final
			FROM progress_service.inscricoes i
			LEFT JOIN user_service.funcionarios f ON f.id = i.funcionario_id
			LEFT JOIN progress_service.progresso_modulos pm ON pm.inscricao_id = i.id
			WHERE i.curso_id = $1
			GROUP BY i.id, i.funcionario_id, i.progresso_percentual, i.status, 
					 i.data_inscricao, i.data_conclusao, f.nome, f.email
			ORDER BY i.data_inscricao DESC
		`, [cursoId]);
		
		return result.rows.map(row => ({
			id: row.id,
			funcionario: {
				id: row.funcionario_id,
				nome: row.funcionario_nome,
				email: row.funcionario_email
			},
			progresso: Number(row.progresso),
			status: row.status,
			data_inscricao: row.data_inscricao,
			data_conclusao: row.data_conclusao || undefined,
			modulos_completos: Number(row.modulos_completos),
			total_modulos: Number(row.total_modulos),
			nota_media: row.nota_final ? Number(row.nota_final) : undefined
		}));
	});
}

export async function startModuleService(inscricaoId: string, moduloId: string) {
	const result = await startModule(inscricaoId, moduloId);
	if (!result) {
		return { erro: 'inscricao_nao_encontrada', mensagem: 'Inscrição não encontrada' };
	}
	if (typeof result === 'object' && 'erro' in result) {
		const errorMap = {
			inscricao_nao_ativa: 'Inscrição não está ativa',
			modulo_ja_iniciado: 'Módulo já foi iniciado anteriormente'
		};
		return { erro: result.erro, mensagem: errorMap[result.erro as keyof typeof errorMap] || 'Erro desconhecido' };
	}
	return { progresso_modulo: result, mensagem: 'Módulo iniciado com sucesso' };
}

export async function completeModuleService(inscricaoId: string, moduloId: string) {
	const result = await completeModuleNew(inscricaoId, moduloId);
	if (!result) {
		return { erro: 'progresso_nao_encontrado', mensagem: 'Progresso do módulo não encontrado' };
	}
	if (typeof result === 'object' && 'erro' in result) {
		const errorMap = {
			modulo_ja_concluido: 'Módulo já foi concluído anteriormente'
		};
		return { erro: result.erro, mensagem: errorMap[result.erro as keyof typeof errorMap] || 'Erro desconhecido' };
	}
	
	// Publica evento de módulo concluído com XP
	const modulePayload: ModuleCompletedPayload = {
		enrollmentId: result.inscricao_id,
		courseId: result.curso_id,
		userId: result.funcionario_id,
		moduleId: result.modulo_id,
		xpEarned: result.xp_ganho,
		progressPercent: result.progresso_percentual,
		completedCourse: result.curso_concluido
	};
	await publishEvent({ type: 'progress.module.completed.v1', source: 'progress-service', payload: modulePayload });
	
	// Se curso foi concluído, publica evento de curso completo
	if (result.curso_concluido) {
		const coursePayload: CourseCompletedPayload = {
			enrollmentId: result.inscricao_id,
			courseId: result.curso_id,
			userId: result.funcionario_id,
			totalProgress: 100
		};
		await publishEvent({ type: 'progress.course.completed.v1', source: 'progress-service', payload: coursePayload });
		
		// Emissão automática de certificado
		try {
			console.log(`📜 Iniciando emissão de certificado para inscricao=${result.inscricao_id}...`);
			const cert = await issueCertificate(result.inscricao_id, result.funcionario_id, result.curso_id);
			console.log(`✅ Certificado ${cert.codigo_certificado} emitido com sucesso!`);
			
			const certEvt: CertificateIssuedPayload = {
				courseId: result.curso_id,
				userId: result.funcionario_id,
				certificateCode: cert.codigo_certificado,
				issuedAt: (cert.data_emissao instanceof Date ? cert.data_emissao : new Date(cert.data_emissao)).toISOString(),
				storageKey: cert.storage_key || null,
				verificationHashFragment: cert.hash_validacao.slice(0, 16)
			};
			await publishEvent({ type: 'certificate.issued.v1', source: 'progress-service', payload: certEvt });
		} catch (e) {
			console.error('❌ Erro ao emitir certificado:', e);
		}
	}
	
	return { 
		resultado: result, 
		mensagem: result.curso_concluido ? 'Módulo concluído e curso finalizado!' : 'Módulo concluído com sucesso' 
	};
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
	
	// Emissão automática de certificado
	try {
		console.log(`📜 [emitCourseCompleted] Iniciando emissão de certificado para inscricao=${r.inscricao_id}...`);
		const cert = await issueCertificate(r.inscricao_id, r.funcionario_id, r.curso_id);
		console.log(`✅ [emitCourseCompleted] Certificado ${cert.codigo_certificado} emitido com sucesso!`);
		
		const certEvt: CertificateIssuedPayload = {
			courseId: r.curso_id,
			userId: r.funcionario_id,
			certificateCode: cert.codigo_certificado,
			issuedAt: (cert.data_emissao instanceof Date ? cert.data_emissao : new Date(cert.data_emissao)).toISOString(),
			storageKey: cert.storage_key || null,
			verificationHashFragment: cert.hash_validacao.slice(0,16)
		};
		await publishEvent({ type: 'certificate.issued.v1', source: 'progress-service', payload: certEvt });
		console.log(`📤 [emitCourseCompleted] Evento certificate.issued.v1 publicado para certificado ${cert.codigo_certificado}`);
	} catch(e){ 
		console.error('❌ [emitCourseCompleted] Erro ao emitir certificado:', e);
		console.error('❌ [emitCourseCompleted] Stack:', e instanceof Error ? e.stack : 'N/A');
	}
}

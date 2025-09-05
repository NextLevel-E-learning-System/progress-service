import { insertInscricao, findInscricao, updateProgresso, completeModuleDb, CompleteResult, listInscricoesByUser } from '../repositories/progressRepository.js';
import { createInscricaoSchema } from '../validation/progressSchemas.js';
import { z } from 'zod';
type CreateInscricaoInput = z.infer<typeof createInscricaoSchema>;
import { HttpError } from '../utils/httpError.js';
import { publishEvent } from '../events/publisher.js';
import { ModuleCompletedPayload, CourseCompletedPayload } from '../events/contracts.js';
export async function createInscricao(d:CreateInscricaoInput){ await insertInscricao(d); return { id:d.id }; }
export async function getInscricao(id:string){ const i = await findInscricao(id); if(!i) throw new HttpError(404,'nao_encontrado'); return i; }
export async function patchProgresso(id:string, valor:number){ const up = await updateProgresso(id, valor); if(!up) throw new HttpError(404,'nao_encontrado'); return up; }
export async function completeModule(inscricaoId:string, moduloId:string){
	const r = await completeModuleDb(inscricaoId, moduloId);
	if(!r) throw new HttpError(404,'nao_encontrado');
	await emitModuleCompleted(r);
	if (r.concluido) await emitCourseCompleted(r);
	return r;
}
export async function listInscricoesUsuario(userId:string){
	return listInscricoesByUser(userId);
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
}

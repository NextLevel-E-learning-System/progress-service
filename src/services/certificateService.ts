import { listCertificatesByUser, issueCertificate, findCertificateByUserCourse } from '../repositories/certificateRepository.js';
import { findInscricao } from '../repositories/progressRepository.js';
import { HttpError } from '../utils/httpError.js';

export async function getUserCertificates(userId:string){ return listCertificatesByUser(userId); }

export async function ensureCertificateForEnrollment(enrollmentId:string){
	const ins = await findInscricao(enrollmentId);
	if(!ins) throw new HttpError(404,'inscricao_nao_encontrada');
	if(ins.status !== 'CONCLUIDO') throw new HttpError(409,'curso_nao_concluido');
	return issueCertificate(enrollmentId, ins.funcionario_id, ins.curso_id); // enrollmentId ignorado no schema real
}

export async function getOrCreateCertificate(enrollmentId:string){
	const ins = await findInscricao(enrollmentId);
	if(!ins) throw new HttpError(404,'inscricao_nao_encontrada');
	const existing = await findCertificateByUserCourse(ins.funcionario_id, ins.curso_id);
	if(existing) return existing;
	return ensureCertificateForEnrollment(enrollmentId);
}

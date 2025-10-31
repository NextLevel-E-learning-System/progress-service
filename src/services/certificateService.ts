import { listCertificatesByUser, issueCertificate, findCertificateByUserCourse } from '../repositories/certificateRepository.js';
import { findInscricao } from '../repositories/progressRepository.js';

export async function getUserCertificates(userId:string){
	const certs = await listCertificatesByUser(userId);
	return { items: certs, mensagem: 'Certificados listados com sucesso' };
}

export async function ensureCertificateForEnrollment(enrollmentId:string){
	const ins = await findInscricao(enrollmentId);
	if(!ins) return { erro:'inscricao_nao_encontrada', mensagem:'Inscrição não encontrada' };
	if(ins.status !== 'CONCLUIDO') return { erro:'curso_nao_concluido', mensagem:'Curso ainda não concluído' };
	const cert = await issueCertificate(enrollmentId, ins.funcionario_id, ins.curso_id);
	return { certificado: cert, inscricao: ins, mensagem: 'Certificado emitido com sucesso' };
}

export async function getOrCreateCertificate(enrollmentId:string){
  const ins = await findInscricao(enrollmentId);
  if(!ins) return { erro:'inscricao_nao_encontrada', mensagem:'Inscrição não encontrada' };
  const existing = await findCertificateByUserCourse(ins.funcionario_id, ins.curso_id);
  if(existing) return { certificado: existing, inscricao: ins, mensagem: 'Certificado recuperado com sucesso' };
  return ensureCertificateForEnrollment(enrollmentId);
}

import { listCertificatesByUser, issueCertificatePlaceholder } from '../repositories/certificateRepository.js';
export async function getUserCertificates(userId:string){ return listCertificatesByUser(userId); }
export async function issueCertificate(enrollmentId:string){ return issueCertificatePlaceholder(enrollmentId); }

import { createHash, randomBytes } from 'crypto';
import { withClient } from '../db.js';

export interface Certificate {
	id: number;
	funcionario_id: string;
	curso_id: string;
	codigo_certificado: string;
	data_emissao: Date;
	hash_validacao: string;
	storage_key?: string | null;
}

export async function listCertificatesByUser(userId: string): Promise<Certificate[]> {
	return withClient(async c => {
		const r = await c.query(`select id, funcionario_id, curso_id, codigo_certificado, data_emissao, hash_validacao, storage_key
															from progress_service.certificados
															where funcionario_id=$1
															order by data_emissao desc`, [userId]);
		return r.rows;
	});
}

export async function findCertificateByUserCourse(userId:string, courseId:string){
	return withClient(async c=>{
		const r = await c.query(`select id, funcionario_id, curso_id, codigo_certificado, data_emissao, hash_validacao, storage_key
															from progress_service.certificados
															where funcionario_id=$1 and curso_id=$2
															order by data_emissao desc limit 1`,[userId, courseId]);
		return r.rows[0] || null;
	});
}

export async function issueCertificate(_enrollmentId:string, userId:string, courseId:string): Promise<Certificate> {
	return withClient(async c=>{
		const existing = await c.query(`select id, funcionario_id, curso_id, codigo_certificado, data_emissao, hash_validacao, storage_key
																		 from progress_service.certificados
																		 where funcionario_id=$1 and curso_id=$2
																		 order by data_emissao desc limit 1`,[userId, courseId]);
		if(existing.rows[0]) return existing.rows[0];
		const codigo = generateCode();
		const hash_validacao = generateHash(codigo, userId, courseId);
		const r = await c.query(`insert into progress_service.certificados
				(funcionario_id, curso_id, codigo_certificado, data_emissao, hash_validacao, storage_key)
				values ($1,$2,$3, now(), $4, null)
				returning id, funcionario_id, curso_id, codigo_certificado, data_emissao, hash_validacao, storage_key`,[userId, courseId, codigo, hash_validacao]);
		return r.rows[0];
	});
}

function generateCode(){
	const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
	let out='';
	for(let i=0;i<12;i++) out += alphabet[Math.floor(Math.random()*alphabet.length)];
	return out;
}

function generateHash(code:string, userId:string, courseId:string){
	const salt = randomBytes(8).toString('hex');
	return createHash('sha256').update(code+':'+userId+':'+courseId+':'+salt).digest('hex');
}

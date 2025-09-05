import { insertInscricao, findInscricao, updateProgresso, completeModuleDb } from '../repositories/progressRepository.js';
import { createInscricaoSchema } from '../validation/progressSchemas.js';
import { z } from 'zod';
type CreateInscricaoInput = z.infer<typeof createInscricaoSchema>;
import { HttpError } from '../utils/httpError.js';
export async function createInscricao(d:CreateInscricaoInput){ await insertInscricao(d); return { id:d.id }; }
export async function getInscricao(id:string){ const i = await findInscricao(id); if(!i) throw new HttpError(404,'nao_encontrado'); return i; }
export async function patchProgresso(id:string, valor:number){ const up = await updateProgresso(id, valor); if(!up) throw new HttpError(404,'nao_encontrado'); return up; }
export async function completeModule(inscricaoId:string, moduloId:string){
	const r = await completeModuleDb(inscricaoId, moduloId);
	if(!r) throw new HttpError(404,'nao_encontrado');
	return r; // inclui novo progresso calculado
}

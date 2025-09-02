import { insertInscricao, findInscricao, updateProgresso } from '../repositories/progressRepository.js';
import { HttpError } from '../utils/httpError.js';
export async function createInscricao(d:any){ await insertInscricao(d); return { id:d.id }; }
export async function getInscricao(id:string){ const i = await findInscricao(id); if(!i) throw new HttpError(404,'nao_encontrado'); return i; }
export async function patchProgresso(id:string, valor:number){ const up = await updateProgresso(id, valor); if(!up) throw new HttpError(404,'nao_encontrado'); return up; }

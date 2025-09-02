import { withClient } from '../db.js';
export async function insertInscricao(d:any){ await withClient(c=>c.query('insert into inscricoes (id, funcionario_id, curso_id, status, progresso_percentual) values ($1,$2,$3,$4,0)', [d.id,d.funcionario_id,d.curso_id,'EM_ANDAMENTO'])); }
export async function findInscricao(id:string){ return withClient(async c=>{ const r = await c.query('select id, funcionario_id, curso_id, status, progresso_percentual, data_inscricao, data_inicio, data_conclusao from inscricoes where id=$1',[id]); return r.rows[0]; }); }
export async function updateProgresso(id:string, valor:number){ return withClient(async c=>{ const r = await c.query('update inscricoes set progresso_percentual=$1 where id=$2 returning id, progresso_percentual',[valor,id]); return r.rows[0]; }); }

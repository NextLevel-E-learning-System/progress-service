import { withClient } from '../db.js';
export interface CompleteResult { inscricao_id:string; modulo_id:string; progresso_percentual:number; concluido:boolean; data_conclusao: Date | null; funcionario_id?:string; curso_id?:string; }
interface InsertInscricao { funcionario_id:string; curso_id:string; }
export async function insertInscricao(d:InsertInscricao){ 
	return withClient(async c => {
		const r = await c.query('insert into progress_service.inscricoes (funcionario_id, curso_id, status, progresso_percentual, data_inicio) values ($1,$2,$3,0,now()) returning *', [d.funcionario_id,d.curso_id,'EM_ANDAMENTO']); 
		return r.rows[0];
	});
}
export async function findInscricao(id:string){ return withClient(async c=>{ const r = await c.query('select id, funcionario_id, curso_id, status, progresso_percentual, data_inscricao, data_inicio, data_conclusao from progress_service.inscricoes where id=$1',[id]); return r.rows[0]; }); }
export async function updateProgresso(id:string, valor:number){ return withClient(async c=>{ const r = await c.query('update progress_service.inscricoes set progresso_percentual=$1 where id=$2 returning id, progresso_percentual',[valor,id]); return r.rows[0]; }); }
export async function completeModuleDb(inscricaoId:string, moduloId:string): Promise<CompleteResult | null> {
	return withClient(async c => {
		// recupera inscrição
		const ins = await c.query('select id, curso_id, funcionario_id, status, progresso_percentual from progress_service.inscricoes where id=$1',[inscricaoId]);
		if(!ins.rows[0]) return null;
		const cursoId = ins.rows[0].curso_id as string;
		const userId = ins.rows[0].funcionario_id as string;
		// upsert progresso_modulos (marca conclusão agora se não existir)
		await c.query(`insert into progress_service.progresso_modulos (id, inscricao_id, modulo_id, data_inicio, data_conclusao, tempo_gasto)
			values (gen_random_uuid(), $1, $2, now(), now(), null)
			on conflict (inscricao_id, modulo_id) do update set data_conclusao=excluded.data_conclusao`,[inscricaoId, moduloId]);
		// total módulos obrigatórios do curso
		const totalMods = await c.query('select count(*) as total from course_service.modulos where curso_id=$1 and obrigatorio=true',[cursoId]);
		const concluidos = await c.query(`select count(distinct pm.modulo_id) as feitos
			from progress_service.progresso_modulos pm
			join course_service.modulos m on m.id=pm.modulo_id
			where pm.inscricao_id=$1 and m.obrigatorio=true and pm.data_conclusao is not null`,[inscricaoId]);
		const total = Number(totalMods.rows[0].total||0);
		const feitos = Number(concluidos.rows[0].feitos||0);
		const progresso = total? Math.round((feitos/total)*100):0;
		// atualiza inscrição
		let dataConclusao: Date | null = null;
		if(progresso === 100){
			await c.query('update progress_service.inscricoes set progresso_percentual=$1, data_conclusao=coalesce(data_conclusao, now()), status=$2 where id=$3',[progresso,'CONCLUIDO',inscricaoId]);
			dataConclusao = new Date();
			// TODO: emitir evento COURSE_COMPLETED para gamification/certificados
		} else {
			await c.query('update progress_service.inscricoes set progresso_percentual=$1 where id=$2',[progresso,inscricaoId]);
		}
		return { inscricao_id: inscricaoId, modulo_id: moduloId, progresso_percentual: progresso, concluido: progresso===100, data_conclusao: dataConclusao, funcionario_id: userId, curso_id: cursoId };
	});
}
export async function listInscricoesByUser(userId:string){
	return withClient(async c=>{
		const r = await c.query(`
			select 
			  id,
			  funcionario_id,
			  curso_id,
			  status,
			  progresso_percentual,
			  data_inscricao,
			  data_inicio,
			  data_conclusao,
			  criado_em,
			  atualizado_em
			from progress_service.inscricoes 
			where funcionario_id=$1 
			order by data_inicio desc
		`,[userId]);
		return r.rows;
	});
}

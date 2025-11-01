import { withClient } from '../db.js';
export interface CompleteResult { inscricao_id:string; modulo_id:string; progresso_percentual:number; concluido:boolean; data_conclusao: Date | null; funcionario_id?:string; curso_id?:string; }
interface InsertInscricao { funcionario_id:string; curso_id:string; }

// Insere nova inscrição (assume que duplicidade já foi checada antes)
export async function insertInscricao(d:InsertInscricao){ 
	return withClient(async c => {
		const r = await c.query('insert into progress_service.inscricoes (funcionario_id, curso_id, status, progresso_percentual, data_inicio) values ($1,$2,$3,0,now()) returning *', [d.funcionario_id,d.curso_id,'EM_ANDAMENTO']); 
		return r.rows[0];
	});
}

// Busca inscrição por id
export async function findInscricao(id:string){ return withClient(async c=>{ const r = await c.query('select id, funcionario_id, curso_id, status, progresso_percentual, data_inscricao, data_inicio, data_conclusao from progress_service.inscricoes where id=$1',[id]); return r.rows[0]; }); }

// Busca inscrição ativa (em andamento) de um usuário em um curso
export async function findActiveInscricaoByUserCourse(funcionarioId:string, cursoId:string){
	return withClient(async c=>{
		const r = await c.query(`select id, funcionario_id, curso_id, status, progresso_percentual, data_inscricao, data_inicio, data_conclusao
			from progress_service.inscricoes
			where funcionario_id=$1 and curso_id=$2 and status in ('EM_ANDAMENTO','CONCLUIDO')
			order by data_inscricao desc limit 1`,[funcionarioId, cursoId]);
		return r.rows[0];
	});
}

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

// Inicia um módulo - cria registro em progresso_modulos
export async function startModule(inscricaoId: string, moduloId: string) {
	return withClient(async c => {
		// Verifica se inscrição existe e está ativa
		const inscricao = await c.query('select id, status from progress_service.inscricoes where id=$1', [inscricaoId]);
		if (!inscricao.rows[0]) return null;
		if (inscricao.rows[0].status !== 'EM_ANDAMENTO') return { erro: 'inscricao_nao_ativa' };
		
		// Verifica se módulo já foi iniciado
		const existing = await c.query('select id from progress_service.progresso_modulos where inscricao_id=$1 and modulo_id=$2', [inscricaoId, moduloId]);
		if (existing.rows[0]) return { erro: 'modulo_ja_iniciado' };
		
		// Cria registro de progresso
		const result = await c.query(`
			insert into progress_service.progresso_modulos (id, inscricao_id, modulo_id, data_inicio, criado_em, atualizado_em) 
			values (gen_random_uuid(), $1, $2, now(), now(), now()) 
			returning *
		`, [inscricaoId, moduloId]);
		
		return result.rows[0];
	});
}

// Finaliza um módulo - atualiza data_conclusao e recalcula progresso do curso
export async function completeModuleNew(inscricaoId: string, moduloId: string) {
	return withClient(async c => {
		// Verifica se módulo foi iniciado
		const progressoModulo = await c.query(`
			select pm.*, i.curso_id, i.funcionario_id 
			from progress_service.progresso_modulos pm
			join progress_service.inscricoes i on i.id = pm.inscricao_id
			where pm.inscricao_id=$1 and pm.modulo_id=$2
		`, [inscricaoId, moduloId]);

		if (!progressoModulo.rows[0]) return null;
		if (progressoModulo.rows[0].data_conclusao) return { erro: 'modulo_ja_concluido' };

		const cursoId = progressoModulo.rows[0].curso_id;
		const funcionarioId = progressoModulo.rows[0].funcionario_id;

		// Busca XP do módulo concluído
		const moduloInfo = await c.query(`
			select xp_modulo from course_service.modulos 
			where id=$1
		`, [moduloId]);

		const xpModulo = Number(moduloInfo.rows[0]?.xp_modulo || 0);

		const dataInicio = new Date(progressoModulo.rows[0].data_inicio);
		const agora = new Date();
		const tempoGastoMin = Math.max(1, Math.round((agora.getTime() - dataInicio.getTime()) / 60000));

		await c.query(`
			update progress_service.progresso_modulos 
			set data_conclusao = now(), tempo_gasto = $3, atualizado_em = now() 
			where inscricao_id=$1 and modulo_id=$2
		`, [inscricaoId, moduloId, tempoGastoMin]);

		// Recalcula progresso do curso
		const totalObrigatorios = await c.query(`
			select count(*) as total from course_service.modulos 
			where curso_id=$1 and obrigatorio=true
		`, [cursoId]);
		
		const concluidos = await c.query(`
			select count(*) as concluidos from progress_service.progresso_modulos pm
			join course_service.modulos m on m.id = pm.modulo_id
			where pm.inscricao_id=$1 and m.obrigatorio=true and pm.data_conclusao is not null
		`, [inscricaoId]);
		
		const total = Number(totalObrigatorios.rows[0].total || 0);
		const feitos = Number(concluidos.rows[0].concluidos || 0);
		const progressoPercentual = total > 0 ? Math.round((feitos / total) * 100) : 0;
		
		// Atualiza progresso da inscrição
		const statusFinal = progressoPercentual === 100 ? 'CONCLUIDO' : 'EM_ANDAMENTO';
		const dataConclusao = progressoPercentual === 100 ? 'now()' : 'data_conclusao';
		
		await c.query(`
			update progress_service.inscricoes 
			set progresso_percentual=$1, status=$2, data_conclusao=${dataConclusao}, atualizado_em=now() 
			where id=$3
		`, [progressoPercentual, statusFinal, inscricaoId]);
		
		return {
			inscricao_id: inscricaoId,
			modulo_id: moduloId,
			progresso_percentual: progressoPercentual,
			curso_concluido: progressoPercentual === 100,
			funcionario_id: funcionarioId,
			curso_id: cursoId,
			xp_ganho: xpModulo,
			tempo_gasto: tempoGastoMin
		};
	});
}// Lista progresso dos módulos de uma inscrição
export async function listModuleProgress(inscricaoId: string) {
	return withClient(async c => {
		const result = await c.query(`
			select 
				id,
				inscricao_id,
				modulo_id,
				data_inicio,
				data_conclusao,
				tempo_gasto,
				criado_em,
				atualizado_em
			from progress_service.progresso_modulos 
			where inscricao_id=$1
			order by data_inicio asc
		`, [inscricaoId]);
		
		return result.rows;
	});
}

// Verifica pré-requisitos de um curso para um funcionário
export async function checkCoursePrerequisites(funcionarioId: string, cursoId: string) {
	return withClient(async c => {
		// Busca pré-requisitos do curso
		const curso = await c.query('select pre_requisitos from course_service.cursos where codigo=$1', [cursoId]);
		if (!curso.rows[0]) return null;
		
		const preRequisitos = curso.rows[0].pre_requisitos || [];
		if (preRequisitos.length === 0) return { atendidos: true, pendentes: [] };
		
		const pendentes = [];
		
		// Verifica cada pré-requisito
		for (const reqCursoId of preRequisitos) {
			const concluido = await c.query(`
				select 1 from progress_service.inscricoes 
				where funcionario_id=$1 and curso_id=$2 and status='CONCLUIDO'
			`, [funcionarioId, reqCursoId]);
			
			if (!concluido.rows[0]) {
				// Busca título do curso pendente
				const cursoInfo = await c.query('select titulo from course_service.cursos where codigo=$1', [reqCursoId]);
				pendentes.push({
					codigo: reqCursoId,
					titulo: cursoInfo.rows[0]?.titulo || reqCursoId
				});
			}
		}
		
		return {
			atendidos: pendentes.length === 0,
			pendentes
		};
	});
}

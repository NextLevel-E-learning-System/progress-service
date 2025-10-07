import { Request, Response, NextFunction } from 'express';
import { createInscricaoSchema, updateProgressoSchema } from '../validation/progressSchemas.js';
import { createInscricao, getInscricao, patchProgresso, completeModule, listInscricoesUsuario } from '../services/progressService.js';

export async function createInscricaoHandler(req:Request,res:Response,next:NextFunction){ 
  const parsed=createInscricaoSchema.safeParse(req.body); 
  if(!parsed.success) return res.status(400).json({ erro:'validation_error', mensagem:'Dados inválidos', detalhes: parsed.error.issues }); 
  try { 
    const r= await createInscricao(parsed.data); 
    if(r && typeof r === 'object' && 'erro' in r && r.erro === 'inscricao_duplicada'){
      return res.status(409).json(r);
    }
    res.status(201).json({ inscricao: r, mensagem: 'Inscrição criada com sucesso' });
  } catch(e){ 
    // Tratamento de possível violação de unicidade (concorrência)
    if (typeof e === 'object' && e !== null && 'code' in e && (e as { code?: string }).code === '23505') {
      return res.status(409).json({ erro:'inscricao_duplicada', mensagem:'Usuário já possui inscrição ativa neste curso (detected race condition)' });
    }
    next(e);
  } 
}

export async function getInscricaoHandler(req:Request,res:Response,next:NextFunction){ 
  try { 
  const r= await getInscricao(req.params.id); 
  if('erro' in r) return res.status(404).json(r);
  res.json(r);
  } catch(e){ 
    next(e);
  } 
}

export async function patchProgressoHandler(req:Request,res:Response,next:NextFunction){ 
  const parsed=updateProgressoSchema.safeParse(req.body); 
  if(!parsed.success) return res.status(400).json({ erro:'validation_error', mensagem:'Dados inválidos', detalhes: parsed.error.issues }); 
  try { 
  const r= await patchProgresso(req.params.id, parsed.data.progresso_percentual); 
  if('erro' in r) return res.status(404).json(r);
  res.json(r);
  } catch(e){ 
    next(e);
  } 
}

export async function completeModuleHandler(req:Request,res:Response,next:NextFunction){
  try { 
  const r = await completeModule(req.params.id, req.params.moduloId); 
  if('erro' in r) return res.status(404).json(r);
  res.status(201).json(r);
  } catch(e){ 
    next(e);
  } 
}

export async function listInscricoesUsuarioHandler(req:Request,res:Response,next:NextFunction){
  try {
    const userId = req.params.userId;
 
    const inscricoes = await listInscricoesUsuario(userId);
    const cursos_em_andamento = inscricoes.filter(i => i.status === 'EM_ANDAMENTO');
    const cursos_concluidos = inscricoes.filter(i => i.status === 'CONCLUIDO');
    res.json({
      items: inscricoes,
      cursos_em_andamento,
      cursos_concluidos,
      total_em_andamento: cursos_em_andamento.length,
      total_concluidos: cursos_concluidos.length,
      mensagem: 'Inscrições do usuário listadas com sucesso'
    });
  } catch(e){
    next(e);
  }
}

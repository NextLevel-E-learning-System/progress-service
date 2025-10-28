import { Request, Response, NextFunction } from 'express';
import { createInscricaoSchema, updateProgressoSchema } from '../validation/progressSchemas.js';
import { createInscricao, getInscricao, patchProgresso, completeModule, listInscricoesUsuario, startModuleService, completeModuleService, listModuleProgressService, listCourseEnrollmentsService } from '../services/progressService.js';

export async function createInscricaoHandler(req:Request,res:Response,next:NextFunction){ 
  const parsed=createInscricaoSchema.safeParse(req.body); 
  if(!parsed.success) return res.status(400).json({ erro:'validation_error', mensagem:'Dados inválidos', detalhes: parsed.error.issues }); 
  try { 
    const r= await createInscricao(parsed.data); 
    if(r && typeof r === 'object' && 'erro' in r){
      if(r.erro === 'inscricao_duplicada'){
        return res.status(409).json(r);
      }
      if(r.erro === 'pre_requisitos_nao_atendidos'){
        return res.status(422).json(r);
      }
      if(r.erro === 'curso_nao_encontrado'){
        return res.status(404).json(r);
      }
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
    res.json({
      items: inscricoes,
      total: inscricoes.length,
      mensagem: 'Inscrições do usuário listadas com sucesso'
    });
  } catch(e){
    next(e);
  }
}

export async function startModuleHandler(req:Request,res:Response,next:NextFunction){
  try {
    const { inscricaoId, moduloId } = req.params;
    
    const r = await startModuleService(inscricaoId, moduloId);
    
    if('erro' in r){
      const statusMap = {
        'inscricao_nao_encontrada': 404,
        'inscricao_nao_ativa': 409,
        'modulo_ja_iniciado': 409
      };
      const status = statusMap[r.erro as keyof typeof statusMap] || 400;
      return res.status(status).json(r);
    }
    
    res.status(201).json(r);
  } catch(e){
    next(e);
  }
}

export async function completeModuleNewHandler(req:Request,res:Response,next:NextFunction){
  try {
    const { inscricaoId, moduloId } = req.params;
    
    const r = await completeModuleService(inscricaoId, moduloId);
    
    if('erro' in r){
      const statusMap = {
        'progresso_nao_encontrado': 404,
        'modulo_ja_concluido': 409
      };
      const status = statusMap[r.erro as keyof typeof statusMap] || 400;
      return res.status(status).json(r);
    }
    
    res.status(200).json(r);
  } catch(e){
    next(e);
  }
}

export async function listModuleProgressHandler(req:Request,res:Response,next:NextFunction){
  try {
    const { inscricaoId } = req.params;
    const progress = await listModuleProgressService(inscricaoId);
    res.json(progress);
  } catch(e){
    next(e);
  }
}

// Novo: Listar inscrições por curso
export async function listInscricoesCursoHandler(req:Request,res:Response,next:NextFunction){
  try {
    const { curso_id } = req.query;
    
    if (!curso_id || typeof curso_id !== 'string') {
      return res.status(400).json({ 
        erro: 'curso_id_ausente', 
        mensagem: 'Parâmetro curso_id é obrigatório' 
      });
    }
    
    const enrollments = await listCourseEnrollmentsService(curso_id);
    
    res.json({
      success: true,
      data: enrollments,
      total: enrollments.length,
      mensagem: 'Inscrições do curso listadas com sucesso'
    });
  } catch(e){
    next(e);
  }
}

import { Request, Response, NextFunction } from 'express';
import {
  getProgressoDetalhado,
  getProximoModulo,
  verificarModuloLiberado,
  marcarConteudoVisualizado,
  marcarModuloConcluido,
  listarModulosComProgresso
} from '../repositories/progressoCompostoRepository.js';
import { ensureCertificateForEnrollment } from '../services/certificateService.js';
import { findInscricao } from '../repositories/progressRepository.js';

/**
 * GET /inscricoes/:id/progresso-detalhado
 * Retorna progresso completo da inscrição (módulos, estatísticas, etc)
 */
export async function getProgressoDetalhadoHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    
    const progresso = await getProgressoDetalhado(id);
    
    if (!progresso) {
      return res.status(404).json({
        success: false,
        erro: 'inscricao_nao_encontrada',
        mensagem: 'Inscrição não encontrada'
      });
    }
    
    res.json({
      success: true,
      data: progresso,
      mensagem: 'Progresso obtido com sucesso'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /inscricoes/:id/proximo-modulo
 * Retorna o próximo módulo não concluído
 */
export async function getProximoModuloHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    
    const proximo = await getProximoModulo(id);
    
    if (!proximo) {
      return res.json({
        success: true,
        data: null,
        mensagem: 'Todos os módulos foram concluídos'
      });
    }
    
    res.json({
      success: true,
      data: proximo,
      mensagem: 'Próximo módulo obtido com sucesso'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /inscricoes/:id/modulos/:moduloId/liberado
 * Verifica se módulo está liberado para o aluno
 */
export async function verificarModuloLiberadoHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id, moduloId } = req.params;
    
    const liberado = await verificarModuloLiberado(id, moduloId);
    
    res.json({
      success: true,
      liberado,
      mensagem: liberado 
        ? 'Módulo liberado para visualização' 
        : 'Módulo bloqueado - complete os módulos anteriores'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /inscricoes/:id/modulos/:moduloId/visualizar
 * Marca que o aluno está visualizando o módulo
 */
export async function marcarConteudoVisualizadoHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id, moduloId } = req.params;
    const { tipo_conteudo } = req.body;
    
    // Verificar se está liberado
    const liberado = await verificarModuloLiberado(id, moduloId);
    
    if (!liberado) {
      return res.status(403).json({
        success: false,
        erro: 'modulo_bloqueado',
        mensagem: 'Complete os módulos anteriores antes de acessar este conteúdo'
      });
    }
    
    await marcarConteudoVisualizado(id, moduloId, tipo_conteudo);
    
    res.json({
      success: true,
      mensagem: 'Progresso atualizado'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /inscricoes/:id/modulos/:moduloId/concluir
 * Marca módulo como concluído e emite certificado automaticamente se o curso foi finalizado
 */

/**
 * GET /inscricoes/:id/modulos-progresso
 * Lista todos os módulos com status de progresso
 */
export async function listarModulosComProgressoHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const { id } = req.params;
    
    const modulos = await listarModulosComProgresso(id);
    
    res.json({
      success: true,
      items: modulos,
      total: modulos.length,
      mensagem: 'Módulos com progresso listados com sucesso'
    });
  } catch (error) {
    next(error);
  }
}

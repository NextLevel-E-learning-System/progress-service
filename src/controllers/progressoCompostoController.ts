import { Request, Response, NextFunction } from 'express';
import {
  listarModulosComProgresso
} from '../repositories/progressoCompostoRepository.js';

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

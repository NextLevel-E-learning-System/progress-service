import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger.js';
export function errorHandler(err:unknown,_req:Request,res:Response,_next:NextFunction){
	logger.error({ err },'unhandled_error');
	return res.status(500).json({ erro:'internal_error', mensagem:'Erro interno inesperado' });
}

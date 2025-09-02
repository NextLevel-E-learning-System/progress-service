import { Request, Response, NextFunction } from 'express';
import { createInscricaoSchema, updateProgressoSchema } from '../validation/progressSchemas.js';
import { createInscricao, getInscricao, patchProgresso } from '../services/progressService.js';
import { HttpError } from '../utils/httpError.js';
export async function createInscricaoHandler(req:Request,res:Response,next:NextFunction){ const parsed=createInscricaoSchema.safeParse(req.body); if(!parsed.success) return next(new HttpError(400,'validation_error',parsed.error.issues)); try { const r= await createInscricao(parsed.data); res.status(201).json(r);} catch(e){ next(e);} }
export async function getInscricaoHandler(req:Request,res:Response,next:NextFunction){ try { const r= await getInscricao(req.params.id); res.json(r);} catch(e){ next(e);} }
export async function patchProgressoHandler(req:Request,res:Response,next:NextFunction){ const parsed=updateProgressoSchema.safeParse(req.body); if(!parsed.success) return next(new HttpError(400,'validation_error',parsed.error.issues)); try { const r= await patchProgresso(req.params.id, parsed.data.progresso_percentual); res.json(r);} catch(e){ next(e);} }

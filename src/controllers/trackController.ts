import { Request, Response, NextFunction } from 'express';
import { getTracks, getUserTrackProgress } from '../services/trackService.js';
export async function listTracksHandler(_req:Request,res:Response,next:NextFunction){ try { const r = await getTracks(); res.json(r);} catch(e){ next(e);} }
export async function userTrackProgressHandler(req:Request,res:Response,next:NextFunction){ try { const r = await getUserTrackProgress(req.params.userId); res.json(r);} catch(e){ next(e);} }

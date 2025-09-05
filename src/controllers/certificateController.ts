import { Request, Response, NextFunction } from 'express';
import { getUserCertificates, issueCertificate } from '../services/certificateService.js';
export async function listCertificatesHandler(req:Request,res:Response,next:NextFunction){ try { const r = await getUserCertificates(req.params.userId); res.json(r);} catch(e){ next(e);} }
export async function issueCertificateHandler(req:Request,res:Response,next:NextFunction){ try { const r = await issueCertificate(req.params.enrollmentId); res.status(201).json(r);} catch(e){ next(e);} }

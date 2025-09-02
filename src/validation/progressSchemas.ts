import { z } from 'zod';
export const createInscricaoSchema = z.object({ id:z.string().uuid(), funcionario_id:z.string().uuid(), curso_id:z.string() });
export const updateProgressoSchema = z.object({ progresso_percentual: z.number().int().min(0).max(100) });

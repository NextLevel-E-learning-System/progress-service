import { z } from 'zod';
export const createInscricaoSchema = z.object({ funcionario_id:z.string().uuid(), curso_id:z.string() });

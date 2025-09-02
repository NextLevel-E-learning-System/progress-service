import express from 'express';
import cors from 'cors';
import pino from 'pino';
import { z } from 'zod';
import { withClient } from './db';
 
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

export function createServer() {
  const app = express();
  app.use(express.json());
  app.use(cors({ origin: '*'}));
  app.use((req, _res, next) => { (req as any).log = logger; next(); });

  app.get('/health/live', (_req, res) => res.json({ status: 'ok' }));
  app.get('/health/ready', (_req, res) => res.json({ status: 'ok' }));

  app.post('/progress/v1/inscricoes', async (req, res) => {
    const schema = z.object({ id: z.string().uuid(), funcionario_id: z.string().uuid(), curso_id: z.string() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'validation_error', details: parsed.error.issues });
    try {
      await withClient(c => c.query('insert into inscricoes (id, funcionario_id, curso_id, status, progresso_percentual) values ($1,$2,$3,$4,0)', [parsed.data.id, parsed.data.funcionario_id, parsed.data.curso_id, 'EM_ANDAMENTO']));
      res.status(201).json({ id: parsed.data.id });
    } catch (err:any) {
      logger.error({ err }, 'create_inscricao_failed');
      res.status(500).json({ error: 'internal_error' });
    }
  });

  app.get('/progress/v1/inscricoes/:id', async (req, res) => {
    try {
      const row = await withClient(async c => {
        const r = await c.query('select id, funcionario_id, curso_id, status, progresso_percentual, data_inscricao, data_inicio, data_conclusao from inscricoes where id=$1', [req.params.id]);
        return r.rows[0];
      });
      if (!row) return res.status(404).json({ error: 'nao_encontrado' });
      res.json(row);
    } catch (err:any) {
      logger.error({ err }, 'get_inscricao_failed');
      res.status(500).json({ error: 'internal_error' });
    }
  });

  app.patch('/progress/v1/inscricoes/:id/progresso', async (req, res) => {
    const schema = z.object({ progresso_percentual: z.number().int().min(0).max(100) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'validation_error' });
    try {
      const updated = await withClient(async c => {
        const r = await c.query('update inscricoes set progresso_percentual=$1 where id=$2 returning id, progresso_percentual', [parsed.data.progresso_percentual, req.params.id]);
        return r.rows[0];
      });
      if (!updated) return res.status(404).json({ error: 'nao_encontrado' });
      res.json(updated);
    } catch (err:any) {
      logger.error({ err }, 'update_progress_failed');
      res.status(500).json({ error: 'internal_error' });
    }
  });

  return app;
}
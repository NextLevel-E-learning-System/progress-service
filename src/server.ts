import express from 'express';
import cors from 'cors';
import { loadOpenApi } from './config/openapi.js';
import { logger } from './config/logger.js';
import { progressRouter } from './routes/progressRoutes.js';
 
export function createServer(){
  const app=express();
  app.use(express.json());
  app.use(cors({origin:'*'}));
  app.use((req,_res,next)=>{ (req as any).log=logger; next(); });
  
  
  app.get('/openapi.json', async (_req,res)=>{
    try {
      const spec = await loadOpenApi('Progress Service API');
      res.json(spec);
    } catch (error) {
      res.status(500).json({ error: 'Failed to load OpenAPI spec' });
    }
  });
  app.use('/progress/v1', progressRouter);
   return app;
}
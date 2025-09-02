import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { loadOpenApi } from './config/openapi.js';
import { logger } from './config/logger.js';
import { healthRouter } from './routes/healthRoutes.js';
import { progressRouter } from './routes/progressRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
export function createServer(){
  const app=express();
  app.use(express.json());
  app.use(cors({origin:'*'}));
  app.use((req,_res,next)=>{ (req as any).log=logger; next(); });
  const spec=loadOpenApi('Progress Service API');
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
  app.use(healthRouter);
  app.use('/progress/v1', progressRouter);
  app.use(errorHandler);
  return app;
}
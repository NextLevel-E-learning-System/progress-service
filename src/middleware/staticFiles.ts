import express from 'express';
import path from 'path';
import { existsSync } from 'fs';

const router = express.Router();

// Middleware para servir arquivos estáticos apenas em modo local
if (process.env.STORAGE_TYPE === 'local') {
  const localStoragePath = process.env.LOCAL_STORAGE_PATH || './storage';
  
  router.use('/storage', (req, res) => {
    const filePath = path.join(process.cwd(), localStoragePath, req.path);
    
    // Verificação de segurança: não permitir navegação fora do diretório storage
    const normalizedPath = path.normalize(filePath);
    const storageDir = path.normalize(path.join(process.cwd(), localStoragePath));
    
    if (!normalizedPath.startsWith(storageDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    if (!existsSync(normalizedPath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    res.sendFile(normalizedPath);
  });
}

export default router;

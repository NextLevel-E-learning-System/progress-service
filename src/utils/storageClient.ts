import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs/promises';
import * as path from 'path';

// Configuração de storage flexível por ambiente
const storageType = process.env.STORAGE_TYPE || 'local'; // 'local' | 's3' | 'minio'
const endpoint = process.env.STORAGE_ENDPOINT; // undefined para AWS S3 oficial
const region = process.env.STORAGE_REGION || 'sa-east-1';
const accessKeyId = process.env.STORAGE_ACCESS_KEY || 'minio';
const secretAccessKey = process.env.STORAGE_SECRET_KEY || 'minio123';
const localStoragePath = process.env.LOCAL_STORAGE_PATH || './storage';
const publicUrlBase = process.env.PUBLIC_URL_BASE || 'http://localhost:3333/storage';
const envPrefix = process.env.STORAGE_ENV_PREFIX || 'dev'; // dev | staging | prod

const forcePathStyle = storageType === 'minio'; // Apenas MinIO usa path-style

// Função para adicionar prefixo de ambiente nas storage keys
function addEnvPrefix(key: string): string {
  return `${envPrefix}/${key}`;
}

export const s3 = storageType !== 'local' ? new S3Client({ 
  region, 
  endpoint: storageType === 'minio' ? endpoint : undefined, // AWS S3 não precisa de endpoint customizado
  forcePathStyle, 
  credentials: { accessKeyId, secretAccessKey } 
}) : null;

export async function uploadObject(params: { bucket: string; key: string; body: Buffer | Uint8Array | string; contentType?: string }) {
  const { bucket, key, body, contentType } = params;
  // Se a key já tem o prefixo de ambiente, não adiciona novamente
  const prefixedKey = key.startsWith(`${envPrefix}/`) ? key : addEnvPrefix(key);
  
  if (storageType === 'local') {
    // Storage local para desenvolvimento
    const bucketPath = path.join(localStoragePath, bucket);
    const filePath = path.join(bucketPath, prefixedKey);
    
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, body);
    
    return { bucket, key: prefixedKey, localPath: filePath };
  } else {
    // S3/MinIO para produção
    await s3!.send(new PutObjectCommand({ Bucket: bucket, Key: prefixedKey, Body: body, ContentType: contentType }));
    return { bucket, key: prefixedKey };
  }
}

export async function presign(bucket: string, key: string, expiresSeconds = 300) {
  // A key que vem do banco já deve incluir o prefixo de ambiente
  // Adiciona o prefixo apenas se ele não estiver presente
  const prefixedKey = key.startsWith(`${envPrefix}/`) ? key : addEnvPrefix(key);
  
  console.log(`🔐 [presign] Tentando gerar presigned URL...`);
  console.log(`   Storage Type: ${storageType}`);
  console.log(`   Bucket: ${bucket}`);
  console.log(`   Key Original: ${key}`);
  console.log(`   Key com Prefixo: ${prefixedKey}`);
  console.log(`   Env Prefix: ${envPrefix}`);
  
  if (storageType === 'local') {
    // Para local, retorna URL direta (sem expiração real)
    return `${publicUrlBase}/${bucket}/${prefixedKey}`;
  } else {
    // S3/MinIO: presigned URL real
    try { 
      console.log(`🔍 [presign] Verificando se arquivo existe no S3...`);
      await s3!.send(new HeadObjectCommand({ Bucket: bucket, Key: prefixedKey })); 
      console.log(`✅ [presign] Arquivo existe! Gerando URL assinada...`);
    } catch (error) { 
      console.error(`❌ [presign] Arquivo NÃO encontrado no S3!`);
      console.error(`   Error:`, error);
      return null; 
    }
    const signedUrl = await getSignedUrl(s3!, new GetObjectCommand({ Bucket: bucket, Key: prefixedKey }), { expiresIn: expiresSeconds });
    console.log(`✅ [presign] URL assinada gerada com sucesso!`);
    return signedUrl;
  }
}

export async function objectExists(bucket: string, key: string) {
  const prefixedKey = key.includes('/') && key.split('/')[0] === envPrefix ? key : addEnvPrefix(key);
  
  if (storageType === 'local') {
    const filePath = path.join(localStoragePath, bucket, prefixedKey);
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  } else {
    try{ 
    await s3!.send(new HeadObjectCommand({ Bucket: bucket, Key: prefixedKey }));
    return true;
    } catch {
      return false;
    }
  }
}
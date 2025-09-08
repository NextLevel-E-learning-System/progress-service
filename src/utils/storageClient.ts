import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import * as fs from 'fs/promises';
import * as path from 'path';

// Configuração de storage flexível por ambiente
const storageType = process.env.STORAGE_TYPE || 'local'; // 'local' | 's3' | 'minio'
const endpoint = process.env.STORAGE_ENDPOINT || 'http://minio:9000';
const region = process.env.STORAGE_REGION || 'us-east-1';
const accessKeyId = process.env.STORAGE_ACCESS_KEY || 'minio';
const secretAccessKey = process.env.STORAGE_SECRET_KEY || 'minio123';
const localStoragePath = process.env.LOCAL_STORAGE_PATH || './storage';
const publicUrlBase = process.env.PUBLIC_URL_BASE || 'http://localhost:3333/storage';
const envPrefix = process.env.STORAGE_ENV_PREFIX || 'dev'; // dev | staging | prod

const forcePathStyle = storageType !== 's3'; // AWS S3 usa virtual-hosted style

// Função para adicionar prefixo de ambiente nas storage keys
function addEnvPrefix(key: string): string {
  return `${envPrefix}/${key}`;
}

// S3 client (usado para S3 real ou MinIO)
export const s3 = storageType !== 'local' ? new S3Client({ 
  region, 
  endpoint: storageType === 's3' ? undefined : endpoint,
  forcePathStyle, 
  credentials: { accessKeyId, secretAccessKey } 
}) : null;

export async function uploadObject(bucket: string, key: string, body: Buffer | Uint8Array | string, contentType?: string) {
  const prefixedKey = addEnvPrefix(key);
  
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

export async function presign(bucket: string, key: string, expires = 300) {
  // Se a key já tem prefixo, usa como está, senão adiciona
  const prefixedKey = key.includes('/') && key.split('/')[0] === envPrefix ? key : addEnvPrefix(key);
  
  if (storageType === 'local') {
    // Para local, retorna URL direta (sem expiração real)
    return `${publicUrlBase}/${bucket}/${prefixedKey}`;
  } else {
    // S3/MinIO: presigned URL real
    try { 
      await s3!.send(new HeadObjectCommand({ Bucket: bucket, Key: prefixedKey })); 
    } catch { 
      return null; 
    }
    return getSignedUrl(s3!, new GetObjectCommand({ Bucket: bucket, Key: prefixedKey }), { expiresIn: expires });
  }
}

export async function objectExists(bucket: string, key: string): Promise<boolean> {
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
    try {
      await s3!.send(new HeadObjectCommand({ Bucket: bucket, Key: prefixedKey }));
      return true;
    } catch {
      return false;
    }
  }
}
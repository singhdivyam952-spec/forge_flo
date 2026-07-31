import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { Readable } from 'stream';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from './env';
import { logger } from './logger';

export interface UploadInput {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  folder?: string;
}

export interface UploadResult {
  key: string;
  url: string;
  size: number;
  mimeType: string;
  originalName: string;
}

export interface StorageDriver {
  upload(input: UploadInput): Promise<UploadResult>;
  download(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getUrl(key: string): Promise<string>;
}

function sanitizeFileName(name: string): string {
  const ext = path.extname(name);
  const base = path.basename(name, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
  const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
  return `${base}-${unique}${ext}`;
}

class LocalStorageDriver implements StorageDriver {
  private readonly baseDir: string;

  constructor(baseDir: string) {
    this.baseDir = path.resolve(process.cwd(), baseDir);
    if (!fs.existsSync(this.baseDir)) {
      fs.mkdirSync(this.baseDir, { recursive: true });
    }
  }

  async upload(input: UploadInput): Promise<UploadResult> {
    const folder = input.folder ?? 'general';
    const folderPath = path.join(this.baseDir, folder);
    if (!fs.existsSync(folderPath)) {
      await fsp.mkdir(folderPath, { recursive: true });
    }

    const fileName = sanitizeFileName(input.originalName);
    const key = path.posix.join(folder, fileName);
    const fullPath = path.join(this.baseDir, folder, fileName);

    await fsp.writeFile(fullPath, input.buffer);

    return {
      key,
      url: `${env.API_URL}/uploads/${key}`,
      size: input.buffer.length,
      mimeType: input.mimeType,
      originalName: input.originalName,
    };
  }

  async download(key: string): Promise<Buffer> {
    const fullPath = path.join(this.baseDir, key);
    return fsp.readFile(fullPath);
  }

  async delete(key: string): Promise<void> {
    const fullPath = path.join(this.baseDir, key);
    if (fs.existsSync(fullPath)) {
      await fsp.unlink(fullPath);
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = path.join(this.baseDir, key);
    return fs.existsSync(fullPath);
  }

  async getUrl(key: string): Promise<string> {
    return `${env.API_URL}/uploads/${key}`;
  }
}

class S3StorageDriver implements StorageDriver {
  private readonly client: S3Client;
  private readonly bucket: string;

  constructor() {
    this.bucket = env.AWS_S3_BUCKET;
    this.client = new S3Client({
      region: env.AWS_REGION,
      endpoint: env.AWS_S3_ENDPOINT || undefined,
      forcePathStyle: env.AWS_S3_FORCE_PATH_STYLE,
      credentials:
        env.AWS_ACCESS_KEY_ID && env.AWS_SECRET_ACCESS_KEY
          ? { accessKeyId: env.AWS_ACCESS_KEY_ID, secretAccessKey: env.AWS_SECRET_ACCESS_KEY }
          : undefined,
    });
  }

  async upload(input: UploadInput): Promise<UploadResult> {
    const folder = input.folder ?? 'general';
    const fileName = sanitizeFileName(input.originalName);
    const key = path.posix.join(folder, fileName);

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: input.buffer,
        ContentType: input.mimeType,
      })
    );

    return {
      key,
      url: await this.getUrl(key),
      size: input.buffer.length,
      mimeType: input.mimeType,
      originalName: input.originalName,
    };
  }

  async download(key: string): Promise<Buffer> {
    const result = await this.client.send(new GetObjectCommand({ Bucket: this.bucket, Key: key }));
    const stream = result.Body as Readable;
    const chunks: Buffer[] = [];
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  async delete(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
      return true;
    } catch {
      return false;
    }
  }

  async getUrl(key: string): Promise<string> {
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
    return getSignedUrl(this.client, command, { expiresIn: 3600 });
  }
}

function createStorageDriver(): StorageDriver {
  if (env.STORAGE_TYPE === 's3') {
    logger.info('Storage driver: S3-compatible');
    return new S3StorageDriver();
  }
  logger.info('Storage driver: Local filesystem');
  return new LocalStorageDriver(env.UPLOAD_DIR);
}

export const storage: StorageDriver = createStorageDriver();

export default storage;

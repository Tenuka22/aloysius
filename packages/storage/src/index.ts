import type { Client as MinioClient } from "minio";

export interface StorageConfig {
  NODE_ENV: "development" | "production" | "test";
  MINIO_ENDPOINT: string;
  MINIO_PORT: number;
  MINIO_ACCESS_KEY: string;
  MINIO_SECRET_KEY: string;
  MINIO_BUCKET?: string;
  MINIO_USE_SSL?: boolean;
}

export interface StoredObject {
  data: Buffer;
  contentType: string;
}

export interface Storage {
  put: (
    key: string,
    data: Buffer | Uint8Array,
    contentType: string
  ) => Promise<void>;
  get: (key: string) => Promise<StoredObject | null>;
  remove: (key: string) => Promise<void>;
  /**
   * Generate a one-time presigned URL for direct client upload to S3/MinIO.
   * The client uploads the file directly, bypassing the server for data transfer.
   */
  getPresignedUploadUrl: (
    key: string,
    contentType: string,
    expiresIn?: number
  ) => Promise<string>;
}

const createMinioBackend = (config: StorageConfig): Storage => {
  const bucket = config.MINIO_BUCKET ?? "aloysius";
  let clientPromise: Promise<MinioClient> | undefined;
  let bucketReady: Promise<void> | undefined;

  const getClient = (): Promise<MinioClient> => {
    if (!clientPromise) {
      clientPromise = (async () => {
        const { Client } = await import("minio");
        return new Client({
          endPoint: config.MINIO_ENDPOINT,
          port: config.MINIO_PORT,
          useSSL: config.MINIO_USE_SSL ?? false,
          accessKey: config.MINIO_ACCESS_KEY,
          secretKey: config.MINIO_SECRET_KEY,
        });
      })();
    }
    return clientPromise;
  };

  const ensureBucket = (): Promise<void> => {
    if (!bucketReady) {
      bucketReady = (async () => {
        const client = await getClient();
        const exists = await client.bucketExists(bucket);
        if (!exists) {
          await client.makeBucket(bucket);
        }
      })();
    }
    return bucketReady;
  };

  return {
    async put(key, data, contentType) {
      await ensureBucket();
      const client = await getClient();
      const buffer = Buffer.from(data);
      await client.putObject(bucket, key, buffer, buffer.length, {
        "Content-Type": contentType,
      });
    },
    async get(key) {
      try {
        const client = await getClient();
        const stream = await client.getObject(bucket, key);
        const chunks: Buffer[] = [];
        for await (const chunk of stream) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }
        const data = Buffer.concat(chunks);
        const stat = await client.statObject(bucket, key);
        const contentType =
          (stat.metaData?.["content-type"] as string | undefined) ??
          "application/octet-stream";
        return { data, contentType };
      } catch {
        return null;
      }
    },
    async remove(key) {
      const client = await getClient();
      await client.removeObject(bucket, key);
    },
    async getPresignedUploadUrl(key, _contentType, expiresIn = 300) {
      await ensureBucket();
      const client = await getClient();
      const url = await client.presignedPutObject(bucket, key, expiresIn);
      // MinIO presigned URLs don't carry Content-Type in the URL itself;
      // the client must set the header when uploading.
      return url;
    },
  };
};

/**
 * Blob storage backed by MinIO (or any S3-compatible endpoint).
 * Used in both development and production — no local file fallback.
 */
export const createStorage = (config: StorageConfig): Storage =>
  createMinioBackend(config);

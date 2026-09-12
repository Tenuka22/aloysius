import { mkdirSync } from "node:fs";
import path from "node:path";

import type { RootDatabase } from "lmdb";
import type { Client as MinioClient } from "minio";

export interface StorageConfig {
  NODE_ENV: "development" | "production" | "test";
  /** Directory for the LMDB-backed store, used outside production. */
  FILE_STORAGE_DIR: string;
  MINIO_ENDPOINT?: string;
  MINIO_PORT?: number;
  MINIO_ACCESS_KEY?: string;
  MINIO_SECRET_KEY?: string;
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
}

interface StoredMeta {
  contentType: string;
}

const DATA_PREFIX = "d:";
const META_PREFIX = "m:";

/**
 * Keys are logical, S3-style object identifiers (forward-slash segments),
 * never real filesystem paths, so this always normalizes with POSIX rules -
 * `node:path`'s OS-native `normalize` would rewrite `/` to `\` on Windows,
 * which would both break MinIO object keys and defeat the absolute-path
 * check below (Windows also treats a bare leading `/` as absolute).
 */
export const normalizeStorageKey = (key: string): string => {
  const normalized = path.posix.normalize(key.replaceAll("\\", "/"));
  if (path.posix.isAbsolute(normalized) || normalized.startsWith("..")) {
    throw new Error(`Invalid storage key: ${key}`);
  }
  return normalized;
};

/**
 * LMDB-backed local file store. `lmdb` ships a platform-specific native
 * binding and is only ever needed outside production, so it's loaded via a
 * dynamic import - a static import would pull it into the production bundle
 * even though `createMinioBackend` is what actually runs there.
 */
const createLmdbBackend = (storageDir: string): Storage => {
  let storePromise: Promise<RootDatabase<Buffer, string>> | undefined;

  const getStore = (): Promise<RootDatabase<Buffer, string>> => {
    if (!storePromise) {
      storePromise = (async () => {
        const { open } = await import("lmdb");
        const filePath = path.resolve(storageDir, "files.mdb");
        mkdirSync(path.dirname(filePath), { recursive: true });
        return open<Buffer, string>({
          path: filePath,
          encoding: "binary",
          compression: false,
          mapSize: 4 * 1024 * 1024 * 1024,
        });
      })();
    }
    return storePromise;
  };

  return {
    async put(key, data, contentType) {
      const db = await getStore();
      const nk = normalizeStorageKey(key);
      await db.transaction(() => {
        db.put(DATA_PREFIX + nk, Buffer.from(data));
        const meta: StoredMeta = { contentType };
        db.put(META_PREFIX + nk, Buffer.from(JSON.stringify(meta)));
      });
    },
    async get(key) {
      const db = await getStore();
      const nk = normalizeStorageKey(key);
      const raw = db.get(DATA_PREFIX + nk);
      if (raw === undefined) {
        return null;
      }
      const data = Buffer.from(raw);
      let contentType = "application/octet-stream";
      const metaRaw = db.get(META_PREFIX + nk);
      if (metaRaw) {
        try {
          const meta = JSON.parse(
            Buffer.from(metaRaw).toString()
          ) as StoredMeta;
          if (meta.contentType) {
            ({ contentType } = meta);
          }
        } catch {
          // Corrupt/missing metadata falls back to the generic content type.
        }
      }
      return { data, contentType };
    },
    async remove(key) {
      const db = await getStore();
      const nk = normalizeStorageKey(key);
      await db.transaction(() => {
        db.remove(DATA_PREFIX + nk);
        db.remove(META_PREFIX + nk);
      });
    },
  };
};

/**
 * MinIO (or any S3-compatible) object store, used in production so uploads
 * survive container restarts/redeploys. Loaded dynamically for the same
 * reason as the LMDB backend: keep it out of paths that never use it.
 */
const createMinioBackend = (config: StorageConfig): Storage => {
  const bucket = config.MINIO_BUCKET ?? "aloysius";
  let clientPromise: Promise<MinioClient> | undefined;
  let bucketReady: Promise<void> | undefined;

  const getClient = (): Promise<MinioClient> => {
    if (!clientPromise) {
      clientPromise = (async () => {
        const { Client } = await import("minio");
        return new Client({
          endPoint: config.MINIO_ENDPOINT ?? "localhost",
          port: config.MINIO_PORT ?? 9000,
          useSSL: config.MINIO_USE_SSL ?? false,
          accessKey: config.MINIO_ACCESS_KEY ?? "minioadmin",
          secretKey: config.MINIO_SECRET_KEY ?? "minioadmin",
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
  };
};

/**
 * Blob storage abstraction: LMDB-backed local files everywhere except
 * production, where MinIO (or any S3-compatible endpoint) takes over.
 */
export const createStorage = (config: StorageConfig): Storage =>
  config.NODE_ENV === "production"
    ? createMinioBackend(config)
    : createLmdbBackend(config.FILE_STORAGE_DIR);

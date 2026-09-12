import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createStorage, normalizeStorageKey } from "./index";

describe("createStorage (LMDB backend)", () => {
  let dir: string;

  beforeEach(() => {
    dir = mkdtempSync(path.join(tmpdir(), "aloysius-storage-"));
  });

  afterEach(() => {
    // LMDB keeps the memory-mapped file open for the process lifetime; on
    // Windows that can make an immediate directory removal fail with EPERM.
    // The OS temp dir is cleaned up eventually either way.
    try {
      rmSync(dir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it("round-trips put/get with the stored content type", async () => {
    const storage = createStorage({ NODE_ENV: "test", FILE_STORAGE_DIR: dir });

    await storage.put(
      "user-1/hello.txt",
      Buffer.from("hello world"),
      "text/plain"
    );
    const result = await storage.get("user-1/hello.txt");

    expect(result?.data.toString()).toBe("hello world");
    expect(result?.contentType).toBe("text/plain");
  });

  it("returns null for a key that was never stored", async () => {
    const storage = createStorage({
      NODE_ENV: "development",
      FILE_STORAGE_DIR: dir,
    });

    await expect(storage.get("does/not-exist.bin")).resolves.toBeNull();
  });

  it("removes stored data and metadata", async () => {
    const storage = createStorage({
      NODE_ENV: "development",
      FILE_STORAGE_DIR: dir,
    });

    await storage.put(
      "a.bin",
      Buffer.from([1, 2, 3]),
      "application/octet-stream"
    );
    await storage.remove("a.bin");

    await expect(storage.get("a.bin")).resolves.toBeNull();
  });

  it("keeps independent state per directory", async () => {
    const dirB = mkdtempSync(path.join(tmpdir(), "aloysius-storage-b-"));
    try {
      const storageA = createStorage({
        NODE_ENV: "test",
        FILE_STORAGE_DIR: dir,
      });
      const storageB = createStorage({
        NODE_ENV: "test",
        FILE_STORAGE_DIR: dirB,
      });

      await storageA.put("shared-key.txt", Buffer.from("from A"), "text/plain");

      await expect(storageB.get("shared-key.txt")).resolves.toBeNull();
    } finally {
      try {
        rmSync(dirB, { recursive: true, force: true });
      } catch {
        // ignore, see note above
      }
    }
  });
});

describe(normalizeStorageKey, () => {
  it("rejects absolute paths and traversal attempts", () => {
    expect(() => normalizeStorageKey("/etc/passwd")).toThrow(
      "Invalid storage key"
    );
    expect(() => normalizeStorageKey("../secrets.txt")).toThrow(
      "Invalid storage key"
    );
    expect(() => normalizeStorageKey("a/../../b")).toThrow(
      "Invalid storage key"
    );
  });

  it("passes through well-formed relative keys", () => {
    expect(normalizeStorageKey("user-1/file.png")).toBe("user-1/file.png");
  });
});

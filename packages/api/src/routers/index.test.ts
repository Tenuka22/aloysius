import { createRouterClient } from "@orpc/server";
import { describe, expect, it, vi } from "vitest";

import type { Context } from "../context";
import { appRouter } from "./index";

/** Chainable query-builder stub; the mock db is cast, so arg types are moot. */
const mockFn = () => vi.fn<(...args: unknown[]) => unknown>();

const makeContext = (overrides: Partial<Context> = {}): Context => ({
  auth: null,
  session: null,
  db: {} as Context["db"],
  storage: {} as Context["storage"],
  ...overrides,
});

const makeAdminSession = () =>
  ({
    user: {
      id: "u1",
      name: "Admin",
      email: "admin@example.com",
      role: "admin",
    },
    session: { id: "s1" },
  }) as unknown as Context["session"];

const makeUserSession = () =>
  ({
    user: { id: "u2", name: "User", email: "user@example.com", role: "user" },
    session: { id: "s2" },
  }) as unknown as Context["session"];

const makeMockDb = (overrides: Record<string, unknown> = {}) => {
  const chain = {
    select: mockFn().mockReturnThis(),
    from: mockFn().mockReturnThis(),
    where: mockFn().mockReturnThis(),
    orderBy: mockFn().mockReturnThis(),
    get: mockFn().mockResolvedValue(null),
    all: mockFn().mockResolvedValue([]),
    insert: mockFn().mockReturnThis(),
    values: mockFn().mockReturnThis(),
    returning: mockFn().mockReturnThis(),
    delete: mockFn().mockReturnThis(),
    run: mockFn().mockResolvedValue(null),
  };
  return { ...chain, ...overrides } as unknown as Context["db"];
};

const makeMockStorage = (overrides: Record<string, unknown> = {}) =>
  ({
    put: mockFn().mockResolvedValue(null),
    get: mockFn().mockResolvedValue(null),
    remove: mockFn().mockResolvedValue(null),
    getPresignedUploadUrl: mockFn().mockResolvedValue(
      "http://minio:9000/bucket/key?presigned=true"
    ),
    ...overrides,
  }) as unknown as Context["storage"];

describe("appRouter.healthCheck", () => {
  it("returns OK without requiring auth", async () => {
    const client = createRouterClient(appRouter, { context: makeContext() });
    await expect(client.healthCheck()).resolves.toBe("OK");
  });
});

describe("appRouter.privateData", () => {
  it("rejects unauthenticated callers", async () => {
    const client = createRouterClient(appRouter, { context: makeContext() });
    await expect(client.privateData()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("returns the caller's session for authenticated callers", async () => {
    const session = makeUserSession();
    const client = createRouterClient(appRouter, {
      context: makeContext({ session }),
    });
    const result = await client.privateData();

    expect(result.message).toBe("This is private");
    expect(result.user).toStrictEqual(session?.user);
  });
});

describe("adminProcedure enforcement", () => {
  it("rejects unauthenticated callers on files endpoints", async () => {
    const client = createRouterClient(appRouter, { context: makeContext() });
    await expect(client.files.listFiles()).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects non-admin callers on files endpoints", async () => {
    const client = createRouterClient(appRouter, {
      context: makeContext({ session: makeUserSession() }),
    });
    await expect(client.files.listFiles()).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});

describe("appRouter.files.listFiles", () => {
  it("allows admin callers and returns file list", async () => {
    const mockDb = makeMockDb({
      all: mockFn().mockResolvedValue([
        {
          id: "f1",
          name: "test.png",
          size: 1024,
          type: "image/webp",
          key: "admin/f1.webp",
          createdAt: new Date("2025-01-01"),
        },
      ]),
    });

    const client = createRouterClient(appRouter, {
      context: makeContext({ session: makeAdminSession(), db: mockDb }),
    });
    const result = await client.files.listFiles();

    expect(result).toHaveLength(1);
    expect(result[0]).toStrictEqual({
      id: "f1",
      name: "test.png",
      size: 1024,
      type: "image/webp",
      url: "/api/files/admin/f1.webp",
      createdAt: new Date("2025-01-01").toISOString(),
    });
  });

  it("returns empty array when no files exist", async () => {
    const client = createRouterClient(appRouter, {
      context: makeContext({
        session: makeAdminSession(),
        db: makeMockDb(),
      }),
    });
    await expect(client.files.listFiles()).resolves.toStrictEqual([]);
  });
});

describe("appRouter.files.getUploadUrl", () => {
  it("rejects unauthenticated callers", async () => {
    const client = createRouterClient(appRouter, { context: makeContext() });
    await expect(
      client.files.getUploadUrl({
        name: "test.png",
        type: "image/png",
        size: 100,
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("rejects non-admin callers", async () => {
    const client = createRouterClient(appRouter, {
      context: makeContext({ session: makeUserSession() }),
    });
    await expect(
      client.files.getUploadUrl({
        name: "test.png",
        type: "image/png",
        size: 100,
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("returns presigned URL for admin callers", async () => {
    const storage = makeMockStorage();
    const client = createRouterClient(appRouter, {
      context: makeContext({ session: makeAdminSession(), storage }),
    });

    const result = await client.files.getUploadUrl({
      name: "photo.png",
      type: "image/png",
      size: 5000,
    });

    expect(result.uploadUrl).toContain("presigned=true");
    expect(result.key).toMatch(/^admin\/[a-f0-9-]+\.png$/u);
    expect(result.expiresInSeconds).toBe(300);
    expect(result.largeFile).toBeFalsy();
  });

  it("marks large files correctly", async () => {
    const storage = makeMockStorage();
    const client = createRouterClient(appRouter, {
      context: makeContext({ session: makeAdminSession(), storage }),
    });

    const result = await client.files.getUploadUrl({
      name: "video.mp4",
      type: "video/mp4",
      size: 10 * 1024 * 1024,
    });

    expect(result.largeFile).toBeTruthy();
  });

  it("rejects files exceeding max size", async () => {
    const client = createRouterClient(appRouter, {
      context: makeContext({ session: makeAdminSession() }),
    });
    await expect(
      client.files.getUploadUrl({
        name: "huge.bin",
        type: "application/octet-stream",
        size: 20 * 1024 * 1024,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });
});

describe("appRouter.files.completeUpload", () => {
  it("rejects unauthenticated callers", async () => {
    const client = createRouterClient(appRouter, { context: makeContext() });
    await expect(
      client.files.completeUpload({
        key: "admin/f1.png",
        name: "f1.png",
        type: "image/png",
        size: 1000,
      })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("creates DB record for admin callers", async () => {
    const mockDb = makeMockDb({
      returning: mockFn().mockReturnValue({
        get: mockFn().mockResolvedValue({
          id: "f1",
          name: "test.png",
          size: 1000,
          type: "image/webp",
          key: "admin/f1.webp",
          createdAt: new Date("2025-01-01"),
        }),
      }),
    });

    const client = createRouterClient(appRouter, {
      context: makeContext({ session: makeAdminSession(), db: mockDb }),
    });

    const result = await client.files.completeUpload({
      key: "admin/f1.webp",
      name: "test.png",
      type: "image/webp",
      size: 1000,
    });

    expect(result.id).toBe("f1");
    expect(result.url).toBe("/api/files/admin/f1.webp");
  });
});

describe("appRouter.files.deleteFile", () => {
  it("rejects unauthenticated callers", async () => {
    const client = createRouterClient(appRouter, { context: makeContext() });
    await expect(client.files.deleteFile({ id: "f1" })).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("rejects non-admin callers", async () => {
    const client = createRouterClient(appRouter, {
      context: makeContext({ session: makeUserSession() }),
    });
    await expect(client.files.deleteFile({ id: "f1" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });

  it("returns NOT_FOUND for non-existent file", async () => {
    const mockDb = makeMockDb({
      get: mockFn().mockResolvedValue(null),
    });

    const client = createRouterClient(appRouter, {
      context: makeContext({ session: makeAdminSession(), db: mockDb }),
    });

    await expect(
      client.files.deleteFile({ id: "nonexistent" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("deletes file and cleans up storage", async () => {
    const storage = makeMockStorage();
    const mockDb = makeMockDb({
      get: mockFn().mockResolvedValue({
        id: "f1",
        key: "admin/f1.png",
      }),
    });

    const client = createRouterClient(appRouter, {
      context: makeContext({
        session: makeAdminSession(),
        db: mockDb,
        storage,
      }),
    });

    const result = await client.files.deleteFile({ id: "f1" });
    expect(result).toStrictEqual({ success: true });
  });

  it("succeeds even when storage removal fails", async () => {
    const storage = makeMockStorage({
      remove: mockFn().mockRejectedValue(new Error("Storage error")),
    });
    const mockDb = makeMockDb({
      get: mockFn().mockResolvedValue({
        id: "f1",
        key: "admin/f1.png",
      }),
    });

    const client = createRouterClient(appRouter, {
      context: makeContext({
        session: makeAdminSession(),
        db: mockDb,
        storage,
      }),
    });

    const result = await client.files.deleteFile({ id: "f1" });
    expect(result).toStrictEqual({ success: true });
  });
});

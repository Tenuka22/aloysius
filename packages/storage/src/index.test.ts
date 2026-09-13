import { describe, expect, it } from "vitest";

import { createStorage } from "./index";

const makeConfig = () => ({
  NODE_ENV: "test" as const,
  MINIO_ENDPOINT: "localhost",
  MINIO_PORT: 9000,
  MINIO_ACCESS_KEY: "minioadmin",
  MINIO_SECRET_KEY: "minioadmin",
  MINIO_BUCKET: "test-bucket",
  MINIO_USE_SSL: false,
});

describe("Storage backend", () => {
  it("returns a storage object with all required methods", () => {
    const storage = createStorage(makeConfig());
    expect(storage.put).toBeTypeOf("function");
    expect(storage.get).toBeTypeOf("function");
    expect(storage.remove).toBeTypeOf("function");
    expect(storage.getPresignedUploadUrl).toBeTypeOf("function");
  });
});

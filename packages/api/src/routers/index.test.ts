import { createRouterClient } from "@orpc/server";
import { describe, expect, it } from "vitest";

import type { Context } from "../context";
import { appRouter } from "./index";

function makeContext(overrides: Partial<Context> = {}): Context {
  return {
    auth: null,
    session: null,
    // healthCheck/privateData never touch the database; only the session gate
    // (requireAuth) matters for these tests.
    db: {} as Context["db"],
    ...overrides,
  };
}

describe("appRouter.healthCheck", () => {
  it("returns OK without requiring auth", async () => {
    const client = createRouterClient(appRouter, { context: makeContext() });
    await expect(client.healthCheck()).resolves.toBe("OK");
  });
});

describe("appRouter.privateData", () => {
  it("rejects unauthenticated callers", async () => {
    const client = createRouterClient(appRouter, { context: makeContext() });
    await expect(client.privateData()).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  });

  it("returns the caller's session for authenticated callers", async () => {
    const session = {
      user: { id: "u1", name: "Test", email: "test@example.com", role: "user" },
      session: { id: "s1" },
    } as unknown as Context["session"];

    const client = createRouterClient(appRouter, { context: makeContext({ session }) });
    const result = await client.privateData();

    expect(result.message).toBe("This is private");
    expect(result.user).toEqual(session!.user);
  });
});

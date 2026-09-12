import { sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { createDb } from "./index";
import { user } from "./schema/auth";
import { createTestDb } from "./testing";

describe(createDb, () => {
  it("connects to the configured libsql URL and can run a query", async () => {
    const db = createDb({ TURSO_DATABASE_URL: ":memory:" });
    const result = await db.get<{ value: number }>(sql`SELECT 1 as value`);
    expect(result).toStrictEqual({ value: 1 });
  });
});

describe(createTestDb, () => {
  it("applies the schema so tables are queryable", async () => {
    const db = await createTestDb();

    await db.insert(user).values({
      id: "user-1",
      name: "Test User",
      email: "test@example.com",
    });

    const rows = await db
      .select()
      .from(user)
      .where(sql`${user.email} = 'test@example.com'`);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.role).toBe("user");
  });

  it("returns an independent database per call", async () => {
    const dbA = await createTestDb();
    await dbA
      .insert(user)
      .values({ id: "a", name: "A", email: "a@example.com" });

    const dbB = await createTestDb();
    const rows = await dbB.select().from(user);

    expect(rows).toHaveLength(0);
  });
});

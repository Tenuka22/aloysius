import { account, user } from "@aloysius/db/schema/auth";
import { createTestDb } from "@aloysius/db/testing";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";

import { createAuth, ensureCmsUser, ensureSiteAdmin } from "./index";
import type { AuthConfig } from "./index";

const ENV: AuthConfig = {
  BETTER_AUTH_URL: "http://localhost:3001",
  BETTER_AUTH_SECRET: "test-secret-test-secret-32-bytes!",
  ADMIN_USERNAME: "admin",
  ADMIN_PASSWORD: "admin123456",
  CMS_USERNAME: "cms",
  CMS_PASSWORD: "cms123456",
};

// The synthetic internal email derived from ADMIN_USERNAME — never used for
// sign-in, but what Better Auth stores in the email column.
const ADMIN_INTERNAL_EMAIL = `${ENV.ADMIN_USERNAME}@aloysius.internal`;

/** Narrows a nullable test fixture, failing fast with a clear message. */
const mustExist = <T>(value: T | null | undefined): T => {
  if (value === null || value === undefined) {
    throw new Error("Expected value to be defined");
  }
  return value;
};

describe("createAuth role assignment", () => {
  it("assigns the admin role when signing up with the derived internal email", async () => {
    const db = await createTestDb();
    const auth = createAuth(ENV, db);

    await auth.api.signUpEmail({
      body: {
        email: ADMIN_INTERNAL_EMAIL,
        password: "whatever12345",
        name: "Site Admin",
      },
    });

    const row = await db
      .select()
      .from(user)
      .where(eq(user.email, ADMIN_INTERNAL_EMAIL))
      .get();
    expect(row?.role).toBe("admin");
  });

  it("assigns the default user role to any other email on sign-up", async () => {
    const db = await createTestDb();
    const auth = createAuth(ENV, db);

    await auth.api.signUpEmail({
      body: {
        email: "someone@example.com",
        password: "whatever12345",
        name: "Someone",
      },
    });

    const row = await db
      .select()
      .from(user)
      .where(eq(user.email, "someone@example.com"))
      .get();
    expect(row?.role).toBe("user");
  });
});

describe(ensureSiteAdmin, () => {
  it("creates the site admin with the configured credentials when none exists", async () => {
    const db = await createTestDb();

    await ensureSiteAdmin(db, ENV);

    const row = await db
      .select()
      .from(user)
      .where(eq(user.username, ENV.ADMIN_USERNAME))
      .get();
    expect(row?.role).toBe("admin");

    const acct = await db
      .select()
      .from(account)
      .where(eq(account.userId, mustExist(row).id))
      .get();
    expect(acct?.password).toBeTruthy();
    await expect(
      verifyPassword({
        hash: mustExist(mustExist(acct).password),
        password: ENV.ADMIN_PASSWORD,
      })
    ).resolves.toBeTruthy();
  });

  it("rotates the existing site admin's password back to the configured default", async () => {
    const db = await createTestDb();

    await ensureSiteAdmin(db, ENV);
    const row = await db
      .select()
      .from(user)
      .where(eq(user.username, ENV.ADMIN_USERNAME))
      .get();
    const acctBefore = await db
      .select()
      .from(account)
      .where(eq(account.userId, mustExist(row).id))
      .get();

    // Someone changed the admin's password out-of-band.
    await db
      .update(account)
      .set({ password: await hashPassword("something-else-entirely") })
      .where(eq(account.id, mustExist(acctBefore).id));

    await ensureSiteAdmin(db, ENV);

    const acctAfter = await db
      .select()
      .from(account)
      .where(eq(account.userId, mustExist(row).id))
      .get();
    await expect(
      verifyPassword({
        hash: mustExist(mustExist(acctAfter).password),
        password: ENV.ADMIN_PASSWORD,
      })
    ).resolves.toBeTruthy();
    await expect(
      verifyPassword({
        hash: mustExist(mustExist(acctAfter).password),
        password: "something-else-entirely",
      })
    ).resolves.toBeFalsy();
  });

  it("does not duplicate the site admin user on repeated calls", async () => {
    const db = await createTestDb();

    await ensureSiteAdmin(db, ENV);
    await ensureSiteAdmin(db, ENV);

    const rows = await db
      .select()
      .from(user)
      .where(eq(user.username, ENV.ADMIN_USERNAME));
    expect(rows).toHaveLength(1);
  });
});

describe(ensureCmsUser, () => {
  it("creates the CMS editor with the configured credentials when none exists", async () => {
    const db = await createTestDb();

    await ensureCmsUser(db, ENV);

    const row = await db
      .select()
      .from(user)
      .where(eq(user.username, ENV.CMS_USERNAME))
      .get();
    expect(row?.role).toBe("cms");

    const acct = await db
      .select()
      .from(account)
      .where(eq(account.userId, mustExist(row).id))
      .get();
    expect(acct?.password).toBeTruthy();
    await expect(
      verifyPassword({
        hash: mustExist(mustExist(acct).password),
        password: ENV.CMS_PASSWORD,
      })
    ).resolves.toBeTruthy();
  });

  it("rotates the existing CMS editor's password back to the configured default", async () => {
    const db = await createTestDb();

    await ensureCmsUser(db, ENV);
    const row = await db
      .select()
      .from(user)
      .where(eq(user.username, ENV.CMS_USERNAME))
      .get();
    const acctBefore = await db
      .select()
      .from(account)
      .where(eq(account.userId, mustExist(row).id))
      .get();

    // Someone changed the CMS editor's password out-of-band.
    await db
      .update(account)
      .set({ password: await hashPassword("something-else-entirely") })
      .where(eq(account.id, mustExist(acctBefore).id));

    await ensureCmsUser(db, ENV);

    const acctAfter = await db
      .select()
      .from(account)
      .where(eq(account.userId, mustExist(row).id))
      .get();
    await expect(
      verifyPassword({
        hash: mustExist(mustExist(acctAfter).password),
        password: ENV.CMS_PASSWORD,
      })
    ).resolves.toBeTruthy();
  });

  it("does not duplicate the CMS editor user on repeated calls", async () => {
    const db = await createTestDb();

    await ensureCmsUser(db, ENV);
    await ensureCmsUser(db, ENV);

    const rows = await db
      .select()
      .from(user)
      .where(eq(user.username, ENV.CMS_USERNAME));
    expect(rows).toHaveLength(1);
  });

  it("grants cms permissions but not staff/qualification permissions", async () => {
    const db = await createTestDb();
    const auth = createAuth(ENV, db);

    await ensureCmsUser(db, ENV);

    const canEditCms = await auth.api.userHasPermission({
      body: { role: "cms", permissions: { cms: ["edit", "publish"] } },
    });
    expect(canEditCms.success).toBeTruthy();

    const canManageStaff = await auth.api.userHasPermission({
      body: { role: "cms", permissions: { staff: ["create"] } },
    });
    expect(canManageStaff.success).toBeFalsy();
  });
});

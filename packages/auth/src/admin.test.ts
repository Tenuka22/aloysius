import { createTestDb } from "@aloysius/db/testing";
import { describe, expect, it } from "vitest";

import { createClubCredential, rotateClubCredentialPassword } from "./admin";
import { createAuth } from "./index";

/**
 * The credential path, end to end against a real database.
 *
 * This exists because the failure it guards against was invisible. Accounts
 * were inserted straight into the `user` and `account` tables, which skipped
 * every check Better Auth applies on its own path: the username rule, the
 * password hasher it is actually configured with, and the shape of the
 * credential row. A row written that way looks perfect in the database and in
 * the admin UI, and the account still cannot sign in — the failure only
 * surfaces at the login screen, as one generic message, with nothing recorded
 * anywhere to say why.
 *
 * So the assertion that matters is not "a row exists". It is "these exact
 * credentials are accepted by the same endpoint a person types into".
 */

const ENV = {
  BETTER_AUTH_SECRET: "test-secret-not-used-for-anything-real-0123456789",
  BETTER_AUTH_URL: "http://localhost:4001",
  CMS_PASSWORD: "cms-editor-password",
  CMS_USERNAME: "cms",
};

/** Club administrator usernames are generated from config, and hyphenated. */
const CLUB_ADMIN = {
  name: "Photography Club administrator",
  password: "debris-cauldron-duplex-prairie-3-4",
  role: "club-admin",
  username: "photography-admin",
} as const;

const authFor = async () => {
  const db = await createTestDb();
  return { auth: createAuth(ENV, db), db };
};

describe("club administrator credentials", () => {
  it("signs in with the credentials it was created with", async () => {
    const { auth } = await authFor();

    const created = await createClubCredential(auth, { ...CLUB_ADMIN });
    expect(created.username).toBe(CLUB_ADMIN.username);

    // No `headers` and no `request`: the same server-side call shape the
    // application uses, so this exercises the real endpoint and not a stub.
    const session = await auth.api.signInUsername({
      body: { password: CLUB_ADMIN.password, username: CLUB_ADMIN.username },
    });

    expect(session.user.id).toBe(created.id);
    expect(session.token).toBeTruthy();
  });

  it("rejects a wrong password rather than accepting anything", async () => {
    const { auth } = await authFor();
    await createClubCredential(auth, { ...CLUB_ADMIN });

    await expect(
      auth.api.signInUsername({
        body: { password: "not-the-password", username: CLUB_ADMIN.username },
      })
    ).rejects.toThrow(/password|credential|username|invalid/iu);
  });

  it("refuses to create the same username twice", async () => {
    const { auth } = await authFor();
    await createClubCredential(auth, { ...CLUB_ADMIN });

    await expect(createClubCredential(auth, { ...CLUB_ADMIN })).rejects.toThrow(
      /already exists/u
    );
  });

  /**
   * The username rule is the whole bug in one assertion. `photography-admin`
   * contains a hyphen, which Better Auth's default rule rejects at sign-in
   * while the account itself is perfectly writable — so this fails if the
   * plugin is ever reverted to its default validator.
   */
  it("accepts a hyphenated username at sign-in", async () => {
    const { auth } = await authFor();
    await createClubCredential(auth, { ...CLUB_ADMIN });

    const session = await auth.api.signInUsername({
      body: { password: CLUB_ADMIN.password, username: CLUB_ADMIN.username },
    });

    expect(session.user.id).toBeTruthy();
  });

  it("refuses a username that could never pass the sign-in rule", async () => {
    const { auth } = await authFor();

    await expect(
      createClubCredential(auth, {
        ...CLUB_ADMIN,
        username: "-leading-hyphen",
      })
    ).rejects.toThrow(/not a valid username/u);
  });

  it("rotates the password and invalidates the old one", async () => {
    const { auth, db } = await authFor();
    const created = await createClubCredential(auth, { ...CLUB_ADMIN });

    await rotateClubCredentialPassword(
      db,
      created.username,
      "thistle-quarry-vesper-71"
    );

    await expect(
      auth.api.signInUsername({
        body: { password: CLUB_ADMIN.password, username: CLUB_ADMIN.username },
      })
    ).rejects.toThrow(/password|credential|username|invalid/iu);

    const session = await auth.api.signInUsername({
      body: {
        password: "thistle-quarry-vesper-71",
        username: CLUB_ADMIN.username,
      },
    });
    expect(session.user.id).toBe(created.id);
  });
});

import { account, session, user } from "@aloysius/db/schema/auth";
import { ORPCError } from "@orpc/server";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import * as v from "valibot";

import { adminProcedure } from "../index";

/**
 * Club seats this page may reset — deliberately **not** `admin` itself.
 * Letting the top administrator reset their own password from a page only
 * they can reach is a no-op as a safeguard and a real way to lock everyone
 * else out by resetting it to a value nobody wrote down; an admin who needs
 * their own password changed uses `scripts/rotate-seat-password.ts` instead,
 * which requires shell access to the server.
 */
const SEEDED_SEATS = [
  { username: "photography-admin", label: "Photography Club Administrator" },
] as const;

/** Every seeded seat (clubs included), whether or not it has signed in yet. */
export const listSeatAccounts = adminProcedure.handler(async ({ context }) => {
  const rows = await context.db
    .select({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user)
    .all();

  const byUsername = new Map(rows.map((row) => [row.username, row]));

  return SEEDED_SEATS.map((seat) => {
    const row = byUsername.get(seat.username);
    return {
      username: seat.username,
      label: seat.label,
      role: row?.role ?? null,
      email: row?.email ?? null,
      exists: row !== undefined,
      createdAt: row?.createdAt.toISOString() ?? null,
    };
  });
});

/** Characters a generated password draws from: no `0/O`, `1/l/I` — the pairs
 * an administrator reading it off a screen to type elsewhere is most likely
 * to mistake for each other. */
const PASSWORD_ALPHABET =
  "ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
const GENERATED_PASSWORD_LENGTH = 20;

const generateSeatPassword = (): string => {
  const bytes = crypto.getRandomValues(
    new Uint8Array(GENERATED_PASSWORD_LENGTH)
  );
  return Array.from(
    bytes,
    (byte) => PASSWORD_ALPHABET[byte % PASSWORD_ALPHABET.length]
  ).join("");
};

/**
 * Generates a new password for one club seat, stores it and revokes every
 * active session for that account. The plaintext is returned exactly once,
 * in this response — nothing persists it, so the caller must show it to the
 * administrator immediately or it is gone.
 *
 * **There is no field to type a password into.** A UI that accepted
 * free-text input would be a second, unaudited path to a credential; every
 * seat password is either the one this generates or the one
 * `scripts/rotate-seat-password.ts` sets from the server's own environment.
 */
export const setSeatPassword = adminProcedure
  .input(v.object({ username: v.pipe(v.string(), v.minLength(1)) }))
  .handler(async ({ input, context }) => {
    const seat = SEEDED_SEATS.find(
      (entry) => entry.username === input.username
    );
    if (!seat) {
      throw new ORPCError("NOT_FOUND", { message: "Unknown seat" });
    }

    const row = await context.db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.username, seat.username))
      .limit(1)
      .get();
    if (!row) {
      throw new ORPCError("NOT_FOUND", {
        message: `No account with username "${seat.username}" — it has not booted yet`,
      });
    }

    const newPassword = generateSeatPassword();

    const updated = await context.db
      .update(account)
      .set({ password: await hashPassword(newPassword) })
      .where(
        and(eq(account.userId, row.id), eq(account.providerId, "credential"))
      )
      .returning({ id: account.id })
      .all();
    if (updated.length === 0) {
      throw new ORPCError("PRECONDITION_FAILED", {
        message: `"${seat.username}" has no credential account to update`,
      });
    }

    const revoked = await context.db
      .delete(session)
      .where(eq(session.userId, row.id))
      .returning({ id: session.id })
      .all();

    return {
      username: seat.username,
      newPassword,
      sessionsRevoked: revoked.length,
    };
  });

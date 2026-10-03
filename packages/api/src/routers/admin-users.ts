import {
  createClubCredential,
  rotateClubCredentialPassword,
} from "@aloysius/auth";
import { user } from "@aloysius/db/schema/auth";
import { club } from "@aloysius/db/schema/clubs";
import { ORPCError } from "@orpc/server";
import { asc, eq } from "drizzle-orm";
import * as v from "valibot";

import { requireAuth } from "../context";
import { adminProcedure } from "../index";
import { HARDCODED_CLUBS, findHardcodedClub } from "./clubs/config";
import { listOffset, listParamsSchema, sortDirectionOf } from "./list-params";

const username = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(64));
const password = v.pipe(v.string(), v.minLength(8), v.maxLength(200));
const name = v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(120));

/**
 * One row of `adminUsers.list`, as selected above.
 *
 * Exported because it appears in the router's inferred output type, and a
 * declaration file cannot name a type it cannot see.
 */
export interface AccountRow {
  id: string;
  name: string;
  role: string | null;
  username: string | null;
  banned: boolean | null;
  banReason: string | null;
}

/** `banned` is nullable in the schema, so "not banned" has to be spelled out. */
const bannedOf = (row: AccountRow) =>
  row.banned === null ? false : row.banned;

const compareByName = (a: AccountRow, b: AccountRow) =>
  a.name.localeCompare(b.name);

/**
 * The sort keys this handler honours, looked up by name.
 *
 * A table rather than a chain of ternaries: an unknown or absent `sortBy` falls
 * through to the name comparator either way, and adding a sortable column means
 * adding a line rather than re-indenting the two beside it.
 */
const ACCOUNT_SORTERS: Record<
  string,
  (a: AccountRow, b: AccountRow) => number
> = {
  name: compareByName,
  username: (a, b) => (a.username ?? "").localeCompare(b.username ?? ""),
  // Banned first on a descending sort, which is why this one is negated
  // relative to the others: the sign is applied by the caller.
  banned: (a, b) => Number(bannedOf(a)) - Number(bannedOf(b)),
};

export const adminUsersRouter = {
  list: adminProcedure
    .input(listParamsSchema)
    .handler(async ({ context, input }) => {
      const rows = await context.db
        .select({
          id: user.id,
          name: user.name,
          role: user.role,
          username: user.username,
          banned: user.banned,
          banReason: user.banReason,
        })
        .from(user)
        .where(eq(user.role, "club-admin"))
        .orderBy(asc(user.name))
        .all();

      const term = input.q.toLowerCase();
      const direction = sortDirectionOf(input, "asc");

      const matching = term
        ? rows.filter((row) =>
            [row.name, row.username, row.role]
              .filter(Boolean)
              .some((field) => String(field).toLowerCase().includes(term))
          )
        : rows;

      const sign = direction === "asc" ? 1 : -1;
      const compare = ACCOUNT_SORTERS[input.sortBy ?? ""] ?? compareByName;
      const sorted = [...matching].toSorted((a, b) => sign * compare(a, b));

      const total = sorted.length;
      const start = listOffset(input);

      return {
        rows: sorted.slice(start, start + input.pageSize),
        total,
      };
    }),

  clubs: adminProcedure.handler(() => HARDCODED_CLUBS),

  create: adminProcedure
    .input(
      v.object({
        clubId: v.pipe(v.string(), v.minLength(1)),
        password,
        name,
      })
    )
    .handler(async ({ context, input }) => {
      const selectedClub = findHardcodedClub(input.clubId);

      if (!selectedClub) {
        throw new ORPCError("NOT_FOUND", { message: "Club not found" });
      }

      try {
        const existingClub = await context.db
          .select({ id: club.id })
          .from(club)
          .where(eq(club.id, selectedClub.id))
          .limit(1);
        if (existingClub.length === 0) {
          await context.db.insert(club).values({
            id: selectedClub.id,
            slug: selectedClub.slug,
            name: selectedClub.name,
            status: selectedClub.status,
          });
        }

        /*
         * No pre-flight "does this username exist" lookup any more: the account
         * is created through Better Auth's admin endpoint, which rejects a
         * duplicate itself, and it rejects it for the right reason rather than
         * for a club that happens to share a username.
         */
        const created = await createClubCredential(requireAuth(context.auth), {
          username: selectedClub.adminUsername,
          password: input.password,
          name: input.name,
          role: "club-admin",
        });
        return { username: created.username };
      } catch (error) {
        throw new ORPCError("CONFLICT", {
          message:
            error instanceof Error ? error.message : "Unable to create user",
        });
      }
    }),

  rotatePassword: adminProcedure
    .input(v.object({ username, password }))
    .handler(async ({ context, input }) => {
      const [clubUser] = await context.db
        .select({ id: user.id, role: user.role })
        .from(user)
        .where(eq(user.username, input.username))
        .limit(1);

      if (!clubUser || clubUser.role !== "club-admin") {
        throw new ORPCError("NOT_FOUND", {
          message: "That user is not a club account",
        });
      }

      try {
        await rotateClubCredentialPassword(
          context.db,
          input.username,
          input.password
        );
      } catch (error) {
        throw new ORPCError("NOT_FOUND", {
          message:
            error instanceof Error
              ? error.message
              : "Unable to rotate password",
        });
      }
      return { ok: true };
    }),
};

import {
  createClubCredential,
  generatePassphrase,
  rotateClubCredentialPassword,
} from "@aloysius/auth";
import { adminActivity } from "@aloysius/db/schema/activity";
import {
  clubContentSubmission,
  globalContentSubmission,
} from "@aloysius/db/schema/approvals";
import type {
  ClubContentSubmission,
  GlobalContentSubmission,
} from "@aloysius/db/schema/approvals";
import { user } from "@aloysius/db/schema/auth";
import { club, CLUB_STATUSES } from "@aloysius/db/schema/clubs";
import type { ClubStatus } from "@aloysius/db/schema/clubs";
import { ORPCError } from "@orpc/server";
import { and, count, desc, eq, max, sql } from "drizzle-orm";
import * as v from "valibot";

import { requireAuth } from "../context";
import { adminProcedure, cmsProcedure, requireClubPermission } from "../index";
import { approveClubSubmission, approveGlobalSubmission } from "./clubs/apply";
import { HARDCODED_CLUBS, findHardcodedClub } from "./clubs/config";
import { titleFromPayload } from "./list-format";
import { listOffset, listParamsSchema, sortDirectionOf } from "./list-params";

export { HARDCODED_CLUBS } from "./clubs/config";

const idInput = v.pipe(v.string(), v.minLength(1));
const payloadInput = v.pipe(v.string(), v.minLength(2));

const reviewError = (error: unknown, fallback: string) =>
  new ORPCError("BAD_REQUEST", {
    message: error instanceof Error ? error.message : fallback,
  });

const clubAdminProcedure = requireClubPermission("submit");

export interface ClubActivityEntry {
  id: string;
  actorUserId: string;
  actorUsername: string | null;
  actorRole: string | null;
  action: string;
  targetType: string;
  targetId: string | null;
  metadata: string | null;
  createdAt: Date;
}

const recordActivity = async (
  db: Parameters<typeof rotateClubCredentialPassword>[0],
  actor: { id: string; username?: string | null; role?: string | null },
  action: string,
  targetType: string,
  targetId: string | null,
  metadata?: Record<string, unknown>
) => {
  await db.insert(adminActivity).values({
    id: crypto.randomUUID(),
    actorUserId: actor.id,
    actorUsername: actor.username ?? null,
    actorRole: actor.role ?? null,
    action,
    targetType,
    targetId,
    metadata: metadata ? JSON.stringify(metadata) : null,
  });
};

const activityFeed = async (
  db: Parameters<typeof rotateClubCredentialPassword>[0],
  filter: { clubId?: string; actorUserId?: string; targetUsername?: string },
  limit: number
): Promise<ClubActivityEntry[]> => {
  /*
   * Three independent reads of three different tables. Nothing here waits on
   * anything above it, so they go out together: the feed is the first thing on
   * an admin page and it is three round trips otherwise.
   */
  const [auditRows, globalRows, clubRows] = await Promise.all([
    db
      .select()
      .from(adminActivity)
      .orderBy(desc(adminActivity.createdAt))
      .limit(limit)
      .all(),
    db
      .select()
      .from(globalContentSubmission)
      .where(
        filter.clubId
          ? eq(globalContentSubmission.submittedByClubId, filter.clubId)
          : eq(globalContentSubmission.submittedById, filter.actorUserId ?? "")
      )
      .orderBy(desc(globalContentSubmission.submittedAt))
      .limit(limit)
      .all(),
    db
      .select()
      .from(clubContentSubmission)
      .where(
        filter.clubId
          ? eq(clubContentSubmission.clubId, filter.clubId)
          : eq(clubContentSubmission.submittedById, filter.actorUserId ?? "")
      )
      .orderBy(desc(clubContentSubmission.submittedAt))
      .limit(limit)
      .all(),
  ]);

  const submissions: ClubActivityEntry[] = [...globalRows, ...clubRows].map(
    (row) => ({
      id: `submission-${row.id}`,
      actorUserId: row.submittedById,
      actorUsername: null,
      actorRole: "club-admin",
      action: `${row.operation}_${row.status}`,
      targetType: row.target,
      targetId: row.targetId,
      metadata: row.reviewNote,
      createdAt: row.reviewedAt ?? row.submittedAt,
    })
  );

  /*
   * A target narrows the feed to one thing; failing that, an actor narrows it to
   * one person's history; failing that it is everything. Written as early
   * returns rather than a nested ternary because the middle step is a *condition
   * on the filter*, not a value, and reading it as a value is how the wrong
   * branch gets picked.
   */
  const auditIsRelevant = (row: (typeof auditRows)[number]) => {
    if (filter.targetUsername) {
      return row.targetId === filter.targetUsername;
    }
    if (filter.actorUserId) {
      return row.actorUserId === filter.actorUserId;
    }
    return true;
  };

  const relevantAudit = auditRows.filter(auditIsRelevant);

  return [...relevantAudit, ...submissions]
    .toSorted((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
};

/**
 * The three fields both pending queues sort on.
 *
 * Exported because it appears in the router's inferred output type, and a
 * declaration file cannot name a type it cannot see.
 */
export interface PendingRow {
  operation: string;
  target: string;
  submittedAt: Date;
}

/**
 * Sorting for `pendingClub` and `pendingGlobal`, which differ only in which table
 * they read.
 *
 * One function rather than a chain of ternaries in each handler: the two queues
 * are the same list over different tables, and a reviewer changing the order of
 * one queue should not have to wonder whether the other means the same thing.
 *
 * `sortDirection` only applies to the default column. The queue's natural order
 * is newest first, so "descending" there means oldest first, and the two named
 * columns are alphabetical in both directions — which is what the column headers
 * say they do.
 *
 * **Generic in the row type, and that is load-bearing.** Declared as
 * `(rows: readonly PendingRow[], ...) => PendingRow[]` it would return the three
 * fields it names, and every caller would hand its handler a `PendingRow[]` —
 * which is how `pendingClub`'s output type ended up asking the web layer for a
 * `payload` field the declaration says does not exist. Preserving the caller's row
 * type costs nothing and keeps the two queues' full output visible to the type
 * that consumes it.
 */
const sortPending = <TRow extends PendingRow>(
  rows: readonly TRow[],
  sortBy: string | undefined,
  sortDirection: "asc" | "desc"
): TRow[] => {
  const copy = [...rows];

  if (sortBy === "operation") {
    return copy.toSorted((a, b) => a.operation.localeCompare(b.operation));
  }

  if (sortBy === "target") {
    return copy.toSorted((a, b) => a.target.localeCompare(b.target));
  }

  const sign = sortDirection === "asc" ? 1 : -1;
  return copy.toSorted(
    (a, b) => sign * (b.submittedAt.getTime() - a.submittedAt.getTime())
  );
};

/* ------------------------------------------------------- club accounts */

/**
 * The columns a club-account table header may order by.
 *
 * Exported because the web layer builds its table's sortable columns from this
 * list rather than writing its own, so a sortable header and an accepted
 * `sortBy` cannot drift into two different sets of strings.
 */
export const CLUB_ACCOUNT_SORT_KEYS = [
  "name",
  "adminUsername",
  "account",
  "status",
  "pendingSubmissions",
  "lastActivityAt",
] as const;

/** What the account table's header may ask the handler to order by. */
export type ClubAccountSortKey = (typeof CLUB_ACCOUNT_SORT_KEYS)[number];

/**
 * The columns the activity feed may be ordered by.
 *
 * Exported for the same reason as `CLUB_ACCOUNT_SORT_KEYS`, and declared here
 * rather than inferred because `activity` reads a merged, in-memory list: the
 * handler only honours these two names and falls through to the date column for
 * anything else, which is exactly the sort of thing a client should not have to
 * discover by pressing a header.
 */
export const ACTIVITY_SORT_KEYS = ["createdAt", "action"] as const;

/** What an activity header may ask the handler to order by. */
export type ActivitySortKey = (typeof ACTIVITY_SORT_KEYS)[number];

/**
 * The statuses the `club` column holds, re-exported so the web layer's filter
 * reads one list rather than a second one written to match it.
 */
export { CLUB_STATUSES as CLUB_STATUS_FILTERS } from "@aloysius/db/schema/clubs";

/**
 * What the account filter may say.
 *
 * Deliberately not `CLUB_STATUSES`: this filter describes the administrator
 * *account*, which has three states a club can be in, where a `club` row has two.
 */
export const CLUB_ACCOUNT_FILTERS = [
  "provisioned",
  "unprovisioned",
  "banned",
] as const;

export type ClubAccountFilter = (typeof CLUB_ACCOUNT_FILTERS)[number];

/**
 * One row of the club accounts table.
 *
 * The club half of the row is the hardcoded configuration; the account half is
 * whatever the `user` table says today. Both halves are assembled together on
 * purpose — a club with no row of its own yet is still a club an administrator
 * has to be able to create an account for, which is why this is built from the
 * registry outwards rather than by querying `club` and silently losing the ones
 * nobody has provisioned.
 *
 * Exported because it appears in the router's inferred output type, and a
 * declaration file cannot name a type it cannot see.
 */
export interface ClubAccountRow {
  id: string;
  slug: string;
  name: string;
  status: ClubStatus;
  adminUsername: string;
  managesSchoolGalleries: boolean;
  /** False while no `user` row exists for `adminUsername`. */
  provisioned: boolean;
  banned: boolean;
  banReason: string | null;
  accountCreatedAt: Date | null;
  pendingClubSubmissions: number;
  pendingGlobalSubmissions: number;
  totalSubmissions: number;
  /**
   * Newest of the three things a club's administrator does: the credential audit
   * trail, the club's own submissions, and its submissions to school-level
   * content.
   *
   * Merged rather than taken from one table because "when did anyone last touch
   * this club" is a question about the club, and a club whose administrator has
   * never rotated a password but sent three galleries has not been idle.
   */
  lastActivityAt: Date | null;
}

/** The db handle the credential helpers take, reused for the reads below. */
type ClubDb = Parameters<typeof rotateClubCredentialPassword>[0];

/**
 * Aggregate values are read defensively, because a SQLite driver may hand an
 * integer column back as a number, a bigint or a string depending on the
 * connection — and `new Date("1700000000000")` is silently the year 4021 rather
 * than an error.
 */
const asDate = (value: unknown): Date | null => {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === "number" || typeof value === "bigint") {
    return new Date(Number(value));
  }
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
};

/** `SUM` and `COUNT` arrive as null or 0 over no rows, depending on the driver. */
const asCount = (value: unknown): number => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

/** The newest of the moments given, or null when none of them are moments. */
const latestOf = (...values: readonly (Date | null)[]): Date | null => {
  let latest: Date | null = null;
  for (const value of values) {
    if (value && (!latest || value.getTime() > latest.getTime())) {
      latest = value;
    }
  }
  return latest;
};

/**
 * Every configured club, joined to the state of its administrator account.
 *
 * Four independent reads — the accounts, and one aggregate per activity source
 * — issued together, because none of them waits on another and this is the first
 * query on two admin pages.
 */
const clubAccountRows = async (db: ClubDb): Promise<ClubAccountRow[]> => {
  const [accounts, clubSubmissions, globalSubmissions, credentialTrail] =
    await Promise.all([
      db
        .select({
          username: user.username,
          banned: user.banned,
          banReason: user.banReason,
          createdAt: user.createdAt,
        })
        .from(user)
        .where(eq(user.role, "club-admin"))
        .all(),
      db
        .select({
          clubId: clubContentSubmission.clubId,
          total: count(),
          pending: sql<number>`sum(case when ${clubContentSubmission.status} = 'pending' then 1 else 0 end)`,
          latest: max(clubContentSubmission.createdAt),
        })
        .from(clubContentSubmission)
        .groupBy(clubContentSubmission.clubId)
        .all(),
      db
        .select({
          clubId: globalContentSubmission.submittedByClubId,
          total: count(),
          pending: sql<number>`sum(case when ${globalContentSubmission.status} = 'pending' then 1 else 0 end)`,
          latest: max(globalContentSubmission.createdAt),
        })
        .from(globalContentSubmission)
        .groupBy(globalContentSubmission.submittedByClubId)
        .all(),
      db
        .select({
          username: adminActivity.targetId,
          latest: max(adminActivity.createdAt),
        })
        .from(adminActivity)
        .where(eq(adminActivity.targetType, "club_admin"))
        .groupBy(adminActivity.targetId)
        .all(),
    ]);

  /*
   * Indexed by the join key rather than scanned per club: the maps are built
   * once and read once per club, which is the difference between two lookups and
   * a nested loop over every account for every club.
   */
  const accountByUsername = new Map<string, (typeof accounts)[number]>();
  for (const account of accounts) {
    if (account.username) {
      accountByUsername.set(account.username, account);
    }
  }

  const clubSubmissionByClub = new Map<
    string,
    (typeof clubSubmissions)[number]
  >();
  for (const row of clubSubmissions) {
    clubSubmissionByClub.set(row.clubId, row);
  }

  const globalSubmissionByClub = new Map<
    string,
    (typeof globalSubmissions)[number]
  >();
  for (const row of globalSubmissions) {
    // Nullable: a global submission sent by a club that has since been removed.
    if (row.clubId) {
      globalSubmissionByClub.set(row.clubId, row);
    }
  }

  const credentialByUsername = new Map<
    string,
    (typeof credentialTrail)[number]
  >();
  for (const row of credentialTrail) {
    if (row.username) {
      credentialByUsername.set(row.username, row);
    }
  }

  return HARDCODED_CLUBS.map((configured) => {
    const account = accountByUsername.get(configured.adminUsername);
    const ownSubmissions = clubSubmissionByClub.get(configured.id);
    const schoolSubmissions = globalSubmissionByClub.get(configured.id);
    const trail = credentialByUsername.get(configured.adminUsername);

    return {
      id: configured.id,
      slug: configured.slug,
      name: configured.name,
      status: configured.status,
      adminUsername: configured.adminUsername,
      managesSchoolGalleries: configured.capabilities.managesSchoolGalleries,
      provisioned: Boolean(account),
      banned: account?.banned === true,
      banReason: account?.banReason ?? null,
      accountCreatedAt: account ? asDate(account.createdAt) : null,
      pendingClubSubmissions: asCount(ownSubmissions?.pending),
      pendingGlobalSubmissions: asCount(schoolSubmissions?.pending),
      totalSubmissions:
        asCount(ownSubmissions?.total) + asCount(schoolSubmissions?.total),
      lastActivityAt: latestOf(
        asDate(ownSubmissions?.latest),
        asDate(schoolSubmissions?.latest),
        asDate(trail?.latest)
      ),
    };
  });
};

const pendingOf = (row: ClubAccountRow) =>
  row.pendingClubSubmissions + row.pendingGlobalSubmissions;

/**
 * A club that has never done anything sorts as the epoch rather than as "no
 * value", so it lands at the top of an ascending date column and the bottom of a
 * descending one — which puts "the clubs nobody has touched" where an
 * administrator looking for neglect will find them.
 */
const activityOf = (row: ClubAccountRow) => row.lastActivityAt?.getTime() ?? 0;

const compareByClubName = (a: ClubAccountRow, b: ClubAccountRow) =>
  a.name.localeCompare(b.name);

/** The sort keys this list honours, looked up by name. */
const CLUB_ACCOUNT_SORTERS: Record<
  string,
  (a: ClubAccountRow, b: ClubAccountRow) => number
> = {
  name: compareByClubName,
  adminUsername: (a, b) => a.adminUsername.localeCompare(b.adminUsername),
  status: (a, b) => a.status.localeCompare(b.status),
  // Banned first on a descending sort: the sign is applied by the caller, so the
  // banned term is negated relative to the other two.
  account: (a, b) =>
    Number(b.banned) - Number(a.banned) ||
    Number(a.provisioned) - Number(b.provisioned),
  pendingSubmissions: (a, b) => pendingOf(a) - pendingOf(b),
  lastActivityAt: (a, b) => activityOf(a) - activityOf(b),
};

/** One predicate per value the account filter offers. */
const ACCOUNT_FILTER_MATCHES: Record<
  ClubAccountFilter,
  (row: ClubAccountRow) => boolean
> = {
  provisioned: (row) => row.provisioned && !row.banned,
  unprovisioned: (row) => !row.provisioned,
  banned: (row) => row.banned,
};

export const adminClubsRouter = {
  list: cmsProcedure.handler(() => HARDCODED_CLUBS),

  /**
   * The club accounts table, as a filtered, sorted, paginated page.
   *
   * Search and sort are applied over the joined rows in memory rather than in
   * SQL for the same reason the pending queues do it: the list is the size of
   * the club registry, which is a constant in `config.ts`, and the honest
   * implementation of "show me every club and the state of its account" is to
   * read every club. Adding a second club does not change that.
   */
  clubAccounts: adminProcedure
    .input(
      v.intersect([
        listParamsSchema,
        v.object({
          status: v.optional(v.picklist(CLUB_STATUSES)),
          account: v.optional(v.picklist(CLUB_ACCOUNT_FILTERS)),
        }),
      ])
    )
    .handler(async ({ context, input }) => {
      const rows = await clubAccountRows(context.db);
      const term = input.q.toLowerCase();

      const matching = rows.filter((row) => {
        if (input.status && row.status !== input.status) {
          return false;
        }
        if (input.account && !ACCOUNT_FILTER_MATCHES[input.account](row)) {
          return false;
        }
        if (!term) {
          return true;
        }
        return [row.name, row.slug, row.adminUsername].some((field) =>
          field.toLowerCase().includes(term)
        );
      });

      const sign = sortDirectionOf(input, "asc") === "asc" ? 1 : -1;
      const compare =
        CLUB_ACCOUNT_SORTERS[input.sortBy ?? ""] ?? compareByClubName;
      const sorted = [...matching].toSorted((a, b) => sign * compare(a, b));

      const total = sorted.length;
      const start = listOffset(input);

      return {
        rows: sorted.slice(start, start + input.pageSize),
        total,
      };
    }),

  /**
   * One club's row, for the per-club screen.
   *
   * The same builder the table reads, narrowed to a single club, so the detail
   * screen and the list can never disagree about whether an account exists —
   * which was the defect when the two read the `user` table separately.
   */
  club: adminProcedure
    .input(v.object({ clubId: idInput }))
    .handler(async ({ context, input }) => {
      const rows = await clubAccountRows(context.db);
      const row = rows.find((candidate) => candidate.id === input.clubId);
      if (!row) {
        throw new ORPCError("NOT_FOUND", { message: "Club not found" });
      }
      return row;
    }),

  ban: cmsProcedure
    .input(
      v.object({
        clubId: idInput,
        reason: v.optional(v.pipe(v.string(), v.maxLength(1000))),
      })
    )
    .handler(async ({ context, input }) => {
      const hardcodedClub = findHardcodedClub(input.clubId);
      if (!hardcodedClub) {
        throw new ORPCError("NOT_FOUND", { message: "Club not found" });
      }
      await context.db
        .update(user)
        .set({ banned: true, banReason: input.reason ?? "Banned by CMS" })
        .where(eq(user.username, hardcodedClub.adminUsername));
      await recordActivity(
        context.db,
        { id: context.session.user.id },
        "ban_club_admin",
        "club_admin",
        hardcodedClub.adminUsername,
        { reason: input.reason ?? "Banned by CMS" }
      );
      return { ok: true };
    }),

  unban: cmsProcedure
    .input(v.object({ clubId: idInput }))
    .handler(async ({ context, input }) => {
      const hardcodedClub = findHardcodedClub(input.clubId);
      if (!hardcodedClub) {
        throw new ORPCError("NOT_FOUND", { message: "Club not found" });
      }
      await context.db
        .update(user)
        .set({ banned: false, banReason: null, banExpires: null })
        .where(eq(user.username, hardcodedClub.adminUsername));
      await recordActivity(
        context.db,
        { id: context.session.user.id },
        "unban_club_admin",
        "club_admin",
        hardcodedClub.adminUsername
      );
      return { ok: true };
    }),

  rotatePassword: adminProcedure
    .input(v.object({ username: idInput }))
    .handler(async ({ context, input }) => {
      try {
        const password = generatePassphrase();
        const configuredClub = HARDCODED_CLUBS.find(
          (clubConfig) => clubConfig.adminUsername === input.username
        );
        if (!configuredClub) {
          throw new Error(
            "That username is not a configured club administrator"
          );
        }
        const existing = await context.db
          .select({ id: user.id })
          .from(user)
          .where(eq(user.username, input.username))
          .get();
        if (existing) {
          await rotateClubCredentialPassword(
            context.db,
            input.username,
            password
          );
        } else {
          const clubRow = await context.db
            .select({ id: club.id })
            .from(club)
            .where(eq(club.id, configuredClub.id))
            .get();
          if (!clubRow) {
            await context.db.insert(club).values({
              id: configuredClub.id,
              slug: configuredClub.slug,
              name: configuredClub.name,
              status: configuredClub.status,
            });
          }
          await createClubCredential(requireAuth(context.auth), {
            username: configuredClub.adminUsername,
            password,
            name: `${configuredClub.name} administrator`,
            role: "club-admin",
          });
        }
        const actor = await context.db
          .select({ username: user.username, role: user.role })
          .from(user)
          .where(eq(user.id, context.session.user.id))
          .get();
        await recordActivity(
          context.db,
          { id: context.session.user.id, ...actor },
          "rotate_password",
          "club_admin",
          input.username
        );
        return { ok: true, password };
      } catch (error) {
        throw reviewError(error, "Unable to rotate password");
      }
    }),

  /*
   * `provisioned: true` is unconditional here, and that is the point of the
   * route: it is only reachable by a signed-in club administrator, so reaching
   * it at all is the proof. Written as a plain `await` rather than a `.then()`
   * because there is nothing to overlap it with — one row, one lookup.
   */
  myAccount: clubAdminProcedure.handler(async ({ context }) => {
    const account = await context.db
      .select({
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        banned: user.banned,
      })
      .from(user)
      .where(eq(user.id, context.session.user.id))
      .get();

    return account ? { ...account, provisioned: true as const } : account;
  }),

  rotateMyPassword: clubAdminProcedure
    .input(v.object({}))
    .handler(async ({ context }) => {
      try {
        const account = await context.db
          .select({ username: user.username, role: user.role })
          .from(user)
          .where(eq(user.id, context.session.user.id))
          .get();
        if (!account?.username) {
          throw new Error("Your account has no username");
        }
        const password = generatePassphrase();
        await rotateClubCredentialPassword(
          context.db,
          account.username,
          password
        );
        await recordActivity(
          context.db,
          { id: context.session.user.id, ...account },
          "rotate_password",
          "own_account",
          context.session.user.id
        );
        return { ok: true, password };
      } catch (error) {
        throw reviewError(error, "Unable to rotate password");
      }
    }),

  activity: adminProcedure
    .input(
      v.intersect([listParamsSchema, v.object({ clubId: v.optional(idInput) })])
    )
    .handler(async ({ context, input }) => {
      const merged = await activityFeed(
        context.db,
        {
          clubId: input.clubId,
          targetUsername: input.clubId
            ? findHardcodedClub(input.clubId)?.adminUsername
            : undefined,
        },
        // The merge of the audit trail and the submission tables happens in
        // memory over a bounded window, so the fetch cap is generous and the
        // paging slice happens after the merge and the sort.
        500
      );

      const term = input.q.toLowerCase();
      const direction = sortDirectionOf(input, "desc");

      const matching = term
        ? merged.filter((entry) =>
            [
              entry.actorUsername,
              entry.actorRole,
              entry.action,
              entry.targetType,
              entry.targetId,
            ]
              .filter(Boolean)
              .some((field) => String(field).toLowerCase().includes(term))
          )
        : merged;

      const sorted =
        input.sortBy === "action"
          ? [...matching].toSorted(
              (a, b) =>
                (direction === "asc" ? 1 : -1) *
                a.action.localeCompare(b.action)
            )
          : [...matching].toSorted(
              (a, b) =>
                (direction === "asc" ? 1 : -1) *
                (b.createdAt.getTime() - a.createdAt.getTime())
            );

      const total = sorted.length;
      const start = listOffset(input);

      return {
        rows: sorted.slice(start, start + input.pageSize),
        total,
      };
    }),

  myActivity: clubAdminProcedure
    .input(v.object({ limit: v.optional(v.number()) }))
    .handler(({ context, input }) =>
      activityFeed(
        context.db,
        { actorUserId: context.session.user.id },
        input.limit ?? 100
      )
    ),

  pendingClub: cmsProcedure
    .input(
      v.intersect([listParamsSchema, v.object({ clubId: v.optional(idInput) })])
    )
    .handler(async ({ context, input }) => {
      const filters = [
        eq(clubContentSubmission.status, "pending"),
        ...(input.clubId
          ? [eq(clubContentSubmission.clubId, input.clubId)]
          : []),
      ];

      const term = input.q.toLowerCase();
      const direction = sortDirectionOf(input, "desc");

      const rows = await context.db
        .select({
          id: clubContentSubmission.id,
          clubId: clubContentSubmission.clubId,
          clubName: club.name,
          target: clubContentSubmission.target,
          operation: clubContentSubmission.operation,
          payload: clubContentSubmission.payload,
          baseSnapshot: clubContentSubmission.baseSnapshot,
          submittedAt: clubContentSubmission.submittedAt,
          submittedBy: user.name,
        })
        .from(clubContentSubmission)
        .innerJoin(club, eq(club.id, clubContentSubmission.clubId))
        .innerJoin(user, eq(user.id, clubContentSubmission.submittedById))
        .where(and(...filters))
        .orderBy(desc(clubContentSubmission.submittedAt))
        .all();

      /*
       * Search and sort are applied over the fetched page-set rather than in
       * SQL because the searchable text - the title - lives inside the stored
       * JSON payload, and SQLite has no index over a JSON path worth asking
       * for. The result set is a queue the size of days, not years, so reading
       * it whole and slicing here is honest and keeps the payload parsing in
       * one place - the same parse the review card below this handler does.
       */
      const matching = term
        ? rows.filter((row) =>
            [
              row.clubName,
              row.submittedBy,
              row.target,
              titleFromPayload(row.payload),
            ]
              .filter(Boolean)
              .some((field) => String(field).toLowerCase().includes(term))
          )
        : rows;

      const sorted = sortPending(matching, input.sortBy, direction);
      const total = sorted.length;
      const start = listOffset(input);

      return {
        rows: sorted.slice(start, start + input.pageSize),
        total,
      };
    }),

  pendingGlobal: cmsProcedure
    .input(listParamsSchema)
    .handler(async ({ context, input }) => {
      const rows = await context.db
        .select({
          id: globalContentSubmission.id,
          clubId: globalContentSubmission.submittedByClubId,
          clubName: club.name,
          target: globalContentSubmission.target,
          operation: globalContentSubmission.operation,
          payload: globalContentSubmission.payload,
          baseSnapshot: globalContentSubmission.baseSnapshot,
          submittedAt: globalContentSubmission.submittedAt,
          submittedBy: user.name,
        })
        .from(globalContentSubmission)
        .leftJoin(club, eq(club.id, globalContentSubmission.submittedByClubId))
        .innerJoin(user, eq(user.id, globalContentSubmission.submittedById))
        .where(eq(globalContentSubmission.status, "pending"))
        .orderBy(desc(globalContentSubmission.submittedAt))
        .all();

      const term = input.q.toLowerCase();
      const direction = sortDirectionOf(input, "desc");

      const matching = term
        ? rows.filter((row) =>
            [
              row.clubName,
              row.submittedBy,
              row.target,
              titleFromPayload(row.payload),
            ]
              .filter(Boolean)
              .some((field) => String(field).toLowerCase().includes(term))
          )
        : rows;

      const sorted = sortPending(matching, input.sortBy, direction);
      const total = sorted.length;
      const start = listOffset(input);

      return {
        rows: sorted.slice(start, start + input.pageSize),
        total,
      };
    }),

  updatePayload: cmsProcedure
    .input(
      v.object({
        kind: v.picklist(["club", "global"]),
        id: idInput,
        payload: payloadInput,
      })
    )
    .handler(async ({ context, input }) => {
      const table =
        input.kind === "club" ? clubContentSubmission : globalContentSubmission;
      const changed = await context.db
        .update(table)
        .set({ payload: input.payload })
        .where(and(eq(table.id, input.id), eq(table.status, "pending")));
      if (changed.rowsAffected === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Pending submission not found",
        });
      }
      return { ok: true };
    }),

  approve: cmsProcedure
    .input(v.object({ kind: v.picklist(["club", "global"]), id: idInput }))
    .handler(async ({ context, input }) => {
      try {
        if (input.kind === "club") {
          const submission = await context.db
            .select()
            .from(clubContentSubmission)
            .where(
              and(
                eq(clubContentSubmission.id, input.id),
                eq(clubContentSubmission.status, "pending")
              )
            )
            .get();
          if (!submission) {
            throw new Error("Pending club submission not found");
          }
          await approveClubSubmission(
            context.db,
            submission as ClubContentSubmission,
            context.session.user.id
          );
        } else {
          const submission = await context.db
            .select()
            .from(globalContentSubmission)
            .where(
              and(
                eq(globalContentSubmission.id, input.id),
                eq(globalContentSubmission.status, "pending")
              )
            )
            .get();
          if (!submission) {
            throw new Error("Pending global submission not found");
          }
          await approveGlobalSubmission(
            context.db,
            submission as GlobalContentSubmission,
            context.session.user.id
          );
        }
        return { ok: true };
      } catch (error) {
        throw reviewError(error, "Unable to approve submission");
      }
    }),

  reject: cmsProcedure
    .input(
      v.object({
        kind: v.picklist(["club", "global"]),
        id: idInput,
        note: v.optional(v.pipe(v.string(), v.maxLength(1000))),
      })
    )
    .handler(async ({ context, input }) => {
      const table =
        input.kind === "club" ? clubContentSubmission : globalContentSubmission;
      const changed = await context.db
        .update(table)
        .set({
          status: "rejected",
          reviewedById: context.session.user.id,
          reviewedAt: new Date(),
          reviewNote: input.note,
        })
        .where(and(eq(table.id, input.id), eq(table.status, "pending")));
      if (changed.rowsAffected === 0) {
        throw new ORPCError("NOT_FOUND", {
          message: "Pending submission not found",
        });
      }
      return { ok: true };
    }),
};

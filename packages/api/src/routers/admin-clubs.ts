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
import { club } from "@aloysius/db/schema/clubs";
import { ORPCError } from "@orpc/server";
import { and, desc, eq } from "drizzle-orm";
import * as v from "valibot";

import { requireAuth } from "../context";
import { adminProcedure, cmsProcedure, requireClubPermission } from "../index";
import { approveClubSubmission, approveGlobalSubmission } from "./clubs/apply";
import { HARDCODED_CLUBS, findHardcodedClub } from "./clubs/config";

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
  const auditRows = await db
    .select()
    .from(adminActivity)
    .orderBy(desc(adminActivity.createdAt))
    .limit(limit)
    .all();
  const globalRows = await db
    .select()
    .from(globalContentSubmission)
    .where(
      filter.clubId
        ? eq(globalContentSubmission.submittedByClubId, filter.clubId)
        : eq(globalContentSubmission.submittedById, filter.actorUserId ?? "")
    )
    .orderBy(desc(globalContentSubmission.submittedAt))
    .limit(limit)
    .all();
  const clubRows = await db
    .select()
    .from(clubContentSubmission)
    .where(
      filter.clubId
        ? eq(clubContentSubmission.clubId, filter.clubId)
        : eq(clubContentSubmission.submittedById, filter.actorUserId ?? "")
    )
    .orderBy(desc(clubContentSubmission.submittedAt))
    .limit(limit)
    .all();

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

  const relevantAudit = auditRows.filter((row) =>
    filter.targetUsername
      ? row.targetId === filter.targetUsername
      : filter.actorUserId
        ? row.actorUserId === filter.actorUserId
        : true
  );

  return [...relevantAudit, ...submissions]
    .toSorted((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
};

export const adminClubsRouter = {
  list: cmsProcedure.handler(() => HARDCODED_CLUBS),

  admin: adminProcedure
    .input(v.object({ clubId: idInput }))
    .handler(async ({ context, input }) => {
      const configuredClub = findHardcodedClub(input.clubId);
      if (!configuredClub) {
        throw new ORPCError("NOT_FOUND", { message: "Club not found" });
      }
      const rows = await context.db
        .select({
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role,
          banned: user.banned,
          banReason: user.banReason,
        })
        .from(user)
        .where(
          eq(
            user.username,
            findHardcodedClub(input.clubId)?.adminUsername ?? ""
          )
        )
        .all();
      if (rows.length > 0) {
        return rows.map((row) => ({ ...row, provisioned: true as const }));
      }
      return [
        {
          id: `unprovisioned-${configuredClub.id}`,
          name: `${configuredClub.name} administrator`,
          username: configuredClub.adminUsername,
          role: "club-admin",
          banned: false,
          banReason: null,
          provisioned: false,
        },
      ];
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

  myAccount: clubAdminProcedure.handler(async ({ context }) =>
    context.db
      .select({
        id: user.id,
        name: user.name,
        username: user.username,
        role: user.role,
        banned: user.banned,
      })
      .from(user)
      .where(eq(user.id, context.session.user.id))
      .get()
      .then((account) =>
        account ? { ...account, provisioned: true as const } : account
      )
  ),

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
      v.object({ clubId: v.optional(idInput), limit: v.optional(v.number()) })
    )
    .handler(({ context, input }) =>
      activityFeed(
        context.db,
        {
          clubId: input.clubId,
          targetUsername: input.clubId
            ? findHardcodedClub(input.clubId)?.adminUsername
            : undefined,
        },
        input.limit ?? 100
      )
    ),

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
    .input(v.object({ clubId: v.optional(idInput) }))
    .handler(({ context, input }) => {
      const filters = [
        eq(clubContentSubmission.status, "pending"),
        ...(input.clubId
          ? [eq(clubContentSubmission.clubId, input.clubId)]
          : []),
      ];

      return context.db
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
    }),

  pendingGlobal: cmsProcedure.handler(({ context }) =>
    context.db
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
      .all()
  ),

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

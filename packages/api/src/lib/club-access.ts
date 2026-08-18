import { and, eq } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { clubMembers, activities, user } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { activityAdminEmail } from "@aloysius-web/auth";

export type MembershipStatus = "pending" | "approved" | "rejected" | "revoked";
export type MembershipRole = "admin" | "member";

export type MembershipRow = {
  id: string;
  activityId: string;
  userId: string;
  name: string | null;
  role: MembershipRole;
  status: MembershipStatus;
  reason: string | null;
  decidedBy: string | null;
  decidedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function serializeMembership(row: MembershipRow) {
  return {
    id: row.id,
    activityId: row.activityId,
    userId: row.userId,
    name: row.name,
    role: row.role,
    status: row.status,
    reason: row.reason,
    decidedBy: row.decidedBy,
    decidedAt: row.decidedAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** The user's email from the Better Auth user table, lowercased, or null. */
export async function getUserEmail(userId: string): Promise<string | null> {
  try {
    const db = createDb();
    const row = db.select({ email: user.email }).from(user).where(eq(user.id, userId)).get();
    return row?.email?.toLowerCase() ?? null;
  } catch {
    return null;
  }
}

export async function getMembership(
  db: ReturnType<typeof createDb>,
  activityId: string,
  userId: string,
): Promise<MembershipRow | undefined> {
  return db
    .select()
    .from(clubMembers)
    .where(and(eq(clubMembers.activityId, activityId), eq(clubMembers.userId, userId)))
    .get();
}

export async function getMembershipById(
  db: ReturnType<typeof createDb>,
  id: string,
): Promise<MembershipRow | undefined> {
  return db.select().from(clubMembers).where(eq(clubMembers.id, id)).get();
}

/** True if the user is an approved member (any role) of the club. */
export function isApprovedMember(membership: MembershipRow | undefined): boolean {
  return membership?.status === "approved";
}

/** True if the user is a club admin (role=admin + approved) OR a site admin (role=admin). */
export function isClubAdmin(membership: MembershipRow | undefined, isSiteAdmin: boolean): boolean {
  if (isSiteAdmin) return true;
  return membership?.role === "admin" && membership?.status === "approved";
}

/**
 * Throws UNAUTHORIZED unless the user is an approved member or club admin of the club.
 * Site admins are always allowed through.
 */
export function assertClubMember(
  membership: MembershipRow | undefined,
  isSiteAdmin: boolean,
  isClubAdmin = false,
): void {
  if (isSiteAdmin || isClubAdmin || isApprovedMember(membership)) return;
  throw new ORPCError("UNAUTHORIZED", {
    message: "You must be an approved member of this club to perform this action.",
  });
}

/**
 * Throws UNAUTHORIZED unless the user is a club admin or site admin.
 */
export function assertClubAdmin(membership: MembershipRow | undefined, isSiteAdmin: boolean): void {
  if (isClubAdmin(membership, isSiteAdmin)) return;
  throw new ORPCError("UNAUTHORIZED", {
    message: "Only club admins can perform this action.",
  });
}

/**
 * Resolves a user's effective access to a club:
 * - site admins can do everything
 * - club admins come from the DB row (role=admin + approved)
 * - otherwise the activity's `adminEmail` is compared against the user's
 *   email from the Better Auth user table, so an admin designated by email
 *   gets access without any metadata sync.
 */
export async function resolveClubAccess(
  db: ReturnType<typeof createDb>,
  activityId: string,
  userId: string,
  isSiteAdmin: boolean,
): Promise<{ membership: MembershipRow | undefined; isClubAdmin: boolean }> {
  const membership = await getMembership(db, activityId, userId);

  let isClubAdmin =
    isSiteAdmin || (membership?.role === "admin" && membership?.status === "approved");

  if (!isClubAdmin) {
    const activity = await db.select().from(activities).where(eq(activities.id, activityId)).get();
    if (activity) {
      const userEmail = await getUserEmail(userId);
      if (
        userEmail &&
        (userEmail === activity.adminEmail?.toLowerCase() ||
          userEmail === activityAdminEmail(activity.slug))
      ) {
        isClubAdmin = true;
      }
    }
  }

  return { membership, isClubAdmin };
}

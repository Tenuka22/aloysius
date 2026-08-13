import { and, eq } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { clubMembers } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { createClerkClient } from "@clerk/backend";
import { env } from "@aloysius-web/env/server";

const clerkClient = createClerkClient({
  secretKey: env.CLERK_SECRET_KEY,
  publishableKey: env.CLERK_PUBLISHABLE_KEY,
});

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
export function isClubAdmin(
  membership: MembershipRow | undefined,
  isSiteAdmin: boolean,
): boolean {
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
export function assertClubAdmin(
  membership: MembershipRow | undefined,
  isSiteAdmin: boolean,
): void {
  if (isClubAdmin(membership, isSiteAdmin)) return;
  throw new ORPCError("UNAUTHORIZED", {
    message: "Only club admins can perform this action.",
  });
}

/**
 * Syncs a user's club memberships into their Clerk publicMetadata
 * under `clubMemberships` as a map of activityId -> { role, status }.
 * This is what makes the "My Clubs" nav link and club info show up automatically.
 */
export async function syncClubMembershipsMetadata(userId: string): Promise<void> {
  try {
    const db = createDb();
    const rows = await db.select().from(clubMembers).where(eq(clubMembers.userId, userId)).all();

    const memberships = Object.fromEntries(
      rows.map((r) => [r.activityId, { role: r.role, status: r.status }]),
    );

    const user = await clerkClient.users.getUser(userId);
    const currentMetadata = (user.publicMetadata ?? {}) as Record<string, unknown>;

    await clerkClient.users.updateUser(userId, {
      publicMetadata: {
        ...currentMetadata,
        clubMemberships: memberships,
      },
    });
  } catch (err) {
    // Metadata sync should never break the primary operation.
    console.error(`[club-access] failed to sync metadata for ${userId}:`, err);
  }
}

/** Reads a user's adminActivities list from Clerk publicMetadata (no DB hit). */
async function getAdminActivitiesFromMetadata(
  userId: string,
): Promise<string[]> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const metadata = (user.publicMetadata ?? {}) as Record<string, unknown>;
    return (metadata.adminActivities as string[]) ?? [];
  } catch {
    return [];
  }
}

/**
 * Resolves a user's effective access to a club:
 * - site admins can do everything
 * - club admins come from the DB row (role=admin + approved) OR the adminActivities
 *   metadata that the activity's adminEmail sync writes (fallback when the
 *   admin hasn't been seeded into club_members yet).
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

  if (!isClubAdmin && !isApprovedMember(membership)) {
    const adminActivities = await getAdminActivitiesFromMetadata(userId);
    if (adminActivities.includes(activityId)) {
      isClubAdmin = true;
    }
  }

  return { membership, isClubAdmin };
}

/** Reads a user's clubMemberships map from Clerk publicMetadata (no DB hit). */
export async function getClubMembershipsFromMetadata(
  userId: string,
): Promise<Record<string, { role: string; status: string }>> {
  try {
    const user = await clerkClient.users.getUser(userId);
    const metadata = (user.publicMetadata ?? {}) as Record<string, unknown>;
    return (metadata.clubMemberships as Record<string, { role: string; status: string }>) ?? {};
  } catch {
    return {};
  }
}
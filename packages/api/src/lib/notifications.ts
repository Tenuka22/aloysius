import { and, eq, sql } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { notifications } from "@aloysius-web/db/schema";

export type NotificationType =
  | "membership_request"
  | "membership_approved"
  | "membership_rejected"
  | "membership_revoked"
  | "content_approved"
  | "content_rejected";

type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
};

/**
 * Creates an in-app notification for a user. Never throws — notification
 * failures must not break the primary operation.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  if (!input.userId) return;
  try {
    const db = createDb();
    await db
      .insert(notifications)
      .values({
        id: crypto.randomUUID(),
        userId: input.userId,
        type: input.type,
        title: input.title,
        body: input.body ?? null,
        link: input.link ?? null,
        read: false,
        createdAt: new Date(),
      })
      .run();
  } catch (err) {
    console.error(`[notifications] failed to create notification for ${input.userId}:`, err);
  }
}

/** Creates notifications for multiple users in a single insert (e.g. all club admins). */
export async function createNotifications(
  inputs: CreateNotificationInput[],
): Promise<void> {
  const valid = inputs.filter((input) => !!input.userId);
  if (valid.length === 0) return;
  try {
    const db = createDb();
    await db
      .insert(notifications)
      .values(
        valid.map((input) => ({
          id: crypto.randomUUID(),
          userId: input.userId,
          type: input.type,
          title: input.title,
          body: input.body ?? null,
          link: input.link ?? null,
          read: false,
          createdAt: new Date(),
        })),
      )
      .run();
  } catch (err) {
    console.error(`[notifications] failed to create ${valid.length} notifications:`, err);
  }
}

export async function unreadNotificationCount(userId: string): Promise<number> {
  try {
    const db = createDb();
    const row = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(and(eq(notifications.userId, userId), eq(notifications.read, false)))
      .get();
    return Number(row?.count ?? 0);
  } catch {
    return 0;
  }
}


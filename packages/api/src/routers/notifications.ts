import { z } from "zod";
import { and, eq, desc } from "drizzle-orm";
import { createDb } from "@aloysius-web/db";
import { notifications } from "@aloysius-web/db/schema";
import { ORPCError } from "@orpc/server";
import { protectedProcedure } from "../index";
import { unreadNotificationCount } from "../lib/notifications";

export const notificationsRouter = {
  /** The current user's notifications, newest first. */
  myNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .handler(async ({ input, context }) => {
      const userId = context.auth?.userId;
      if (!userId) throw new ORPCError("UNAUTHORIZED");

      const db = createDb();
      const rows = await db
        .select()
        .from(notifications)
        .where(eq(notifications.userId, userId))
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit)
        .all();

      return {
        rows: rows.map((row) => ({
          id: row.id,
          type: row.type,
          title: row.title,
          body: row.body,
          link: row.link,
          read: row.read,
          createdAt: row.createdAt.toISOString(),
        })),
        unread: await unreadNotificationCount(userId),
      };
    }),

  /** Unread notification count for the current user. */
  unreadCount: protectedProcedure.handler(async ({ context }) => {
    const userId = context.auth?.userId;
    if (!userId) throw new ORPCError("UNAUTHORIZED");
    return unreadNotificationCount(userId);
  }),

  /** Mark a single notification as read. */
  markRead: protectedProcedure
    .input(z.object({ id: z.string() }))
    .handler(async ({ input, context }) => {
      const userId = context.auth?.userId;
      if (!userId) throw new ORPCError("UNAUTHORIZED");

      const db = createDb();
      await db
        .update(notifications)
        .set({ read: true })
        .where(and(eq(notifications.id, input.id), eq(notifications.userId, userId)))
        .run();

      return { success: true };
    }),

  /** Mark all of the current user's notifications as read. */
  markAllRead: protectedProcedure.handler(async ({ context }) => {
    const userId = context.auth?.userId;
    if (!userId) throw new ORPCError("UNAUTHORIZED");

    const db = createDb();
    await db
      .update(notifications)
      .set({ read: true })
      .where(eq(notifications.userId, userId))
      .run();

    return { success: true };
  }),
};

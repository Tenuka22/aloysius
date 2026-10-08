import {
  announcement,
  announcementIdSchema,
} from "@aloysius/db/schema/announcements";
import { fileIdSchema } from "@aloysius/db/schema/files";
import { ORPCError } from "@orpc/server";
import { and, desc, eq } from "drizzle-orm";
import * as v from "valibot";

import { cmsProcedure, publicProcedure } from "../../index";
import { resolveFileUrls } from "../files/file-urls";

const ANNOUNCEMENT_AUDIENCES = [
  "all",
  "students",
  "staff",
  "parents",
  "alumni",
] as const;
const ANNOUNCEMENT_SEVERITIES = ["info", "important", "urgent"] as const;

const announcementFieldsSchema = v.object({
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  body: v.pipe(v.string(), v.minLength(1), v.maxLength(4000)),
  audience: v.optional(v.picklist(ANNOUNCEMENT_AUDIENCES), "all"),
  severity: v.optional(v.picklist(ANNOUNCEMENT_SEVERITIES), "info"),
  isPinned: v.optional(v.boolean(), false),
  imageId: v.optional(v.nullable(fileIdSchema)),
  effectiveFrom: v.optional(v.nullable(v.pipe(v.string(), v.isoTimestamp()))),
  expiresAt: v.optional(v.nullable(v.pipe(v.string(), v.isoTimestamp()))),
});

const slugify = (title: string, id: string) =>
  `${title
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/gu, "-")
    .replaceAll(/(?<edgeDash>^-|-$)/gu, "")
    .slice(0, 60)}-${id.slice(0, 8)}`;

/**
 * Every announcement, newest-first (pinned ones lifted to the top). This one
 * query backs both the public notice strip and the CMS management screen -
 * there is no draft state here, a row is live the moment it exists, so there
 * is nothing an admin-only query would show that the public one would not.
 */
export const listAnnouncements = publicProcedure.handler(
  async ({ context }) => {
    const rows = await context.db
      .select({
        id: announcement.id,
        title: announcement.title,
        body: announcement.body,
        audience: announcement.audience,
        severity: announcement.severity,
        isPinned: announcement.isPinned,
        imageId: announcement.imageId,
        effectiveFrom: announcement.effectiveFrom,
        expiresAt: announcement.expiresAt,
        publishedAt: announcement.publishedAt,
      })
      .from(announcement)
      .orderBy(desc(announcement.isPinned), desc(announcement.publishedAt))
      .all();

    const urls = await resolveFileUrls(
      context.db,
      rows.flatMap((row) => (row.imageId ? [row.imageId] : []))
    );

    return rows.map((row) => ({
      ...row,
      imageUrl: row.imageId ? (urls.get(row.imageId) ?? null) : null,
      effectiveFrom: row.effectiveFrom?.toISOString() ?? null,
      expiresAt: row.expiresAt?.toISOString() ?? null,
      publishedAt: row.publishedAt?.toISOString() ?? null,
    }));
  }
);

/**
 * CMS staff writing an announcement directly - no club, no review queue. The
 * author stands in as their own reviewer so `announcement_review_fields_paired`
 * still holds, and the row is live (`status: 'approved'`) the instant it is
 * created.
 */
export const createAnnouncement = cmsProcedure
  .input(announcementFieldsSchema)
  .handler(async ({ input, context }) => {
    const id = crypto.randomUUID();
    const now = new Date();
    const record = await context.db
      .insert(announcement)
      .values({
        id,
        club: null,
        slug: slugify(input.title, id),
        title: input.title,
        body: input.body,
        audience: input.audience,
        severity: input.severity,
        isPinned: input.isPinned,
        imageId: input.imageId ?? null,
        effectiveFrom: input.effectiveFrom
          ? new Date(input.effectiveFrom)
          : null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        authorId: context.session.user.id,
        status: "approved",
        reviewedById: context.session.user.id,
        reviewedAt: now,
        publishedAt: now,
      })
      .returning()
      .get();

    if (!record) {
      throw new ORPCError("INTERNAL_SERVER_ERROR");
    }

    return { id: record.id };
  });

export const updateAnnouncement = cmsProcedure
  .input(
    v.object({ id: announcementIdSchema, ...announcementFieldsSchema.entries })
  )
  .handler(async ({ input, context }) => {
    const record = await context.db
      .update(announcement)
      .set({
        title: input.title,
        body: input.body,
        audience: input.audience,
        severity: input.severity,
        isPinned: input.isPinned,
        imageId: input.imageId ?? null,
        effectiveFrom: input.effectiveFrom
          ? new Date(input.effectiveFrom)
          : null,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      })
      .where(eq(announcement.id, input.id))
      .returning({ id: announcement.id })
      .get();

    if (!record) {
      throw new ORPCError("NOT_FOUND", { message: "Announcement not found" });
    }

    return { id: record.id };
  });

export const deleteAnnouncement = cmsProcedure
  .input(v.object({ id: announcementIdSchema }))
  .handler(async ({ input, context }) => {
    const deleted = await context.db
      .delete(announcement)
      .where(and(eq(announcement.id, input.id)))
      .returning({ id: announcement.id })
      .all();

    if (deleted.length === 0) {
      throw new ORPCError("NOT_FOUND", { message: "Announcement not found" });
    }

    return { id: input.id };
  });

import { sql } from "drizzle-orm";
import type { SQL, SQLWrapper } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-orm/valibot";
import * as v from "valibot";

import { user } from "./auth";
import { brand } from "./brand";
import type { Brand } from "./brand";
import { CLUBS, clubSlugSchema } from "./clubs";
import { fileIdSchema, files } from "./files";
import { newsPost } from "./news-posts";
import { achievement, event } from "./root-content";

export { CLUBS, clubSlugSchema } from "./clubs";
export type { ClubSlug } from "./clubs";

/** `column in ('a', 'b')` for a CHECK. Values are code constants, never input. */
const sqlInList = (column: SQLWrapper, values: readonly string[]): SQL =>
  sql`${column} in (${sql.raw(values.map((value) => `'${value}'`).join(", "))})`;

export type ClubPhotoId = Brand<string, "ClubPhotoId">;
export const clubPhotoIdSchema = v.pipe(
  v.string(),
  brand<string, "ClubPhotoId">()
);

export const clubPhotoStatusSchema = v.picklist([
  "pending",
  "approved",
  "rejected",
]);
export type ClubPhotoStatus = v.InferOutput<typeof clubPhotoStatusSchema>;

export const CLUB_PHOTO_LINK_KINDS = ["news", "event", "achievement"] as const;
export type ClubPhotoLinkKind = (typeof CLUB_PHOTO_LINK_KINDS)[number];
export const clubPhotoLinkKindSchema = v.picklist(CLUB_PHOTO_LINK_KINDS);

/**
 * One row per photo a club submits for the public gallery.
 *
 * No row here is live content on its own: `status` starts `pending`, the
 * public gallery query only ever selects `approved` rows
 * (`listApprovedClubPhotos`), and the file-read route only serves a
 * `pending`/`rejected` row's bytes back to its submitter or a CMS reviewer —
 * so nothing a club uploads is visible to the public, or even guessable by
 * URL, before a reviewer acts on it.
 *
 * `club_photo_review_fields_paired` makes "approved with no reviewer" and
 * "still pending but reviewed" both unrepresentable, the same shape as
 * `leave_request`'s finalised-fields pairing — a free-text status column with
 * no such constraint is exactly the gap the source system this feature was
 * modelled on left open.
 */
export const clubPhoto = sqliteTable(
  "club_photo",
  {
    id: text("id").primaryKey(),
    club: text("club").notNull(),
    fileId: text("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "cascade" }),
    caption: text("caption").notNull(),
    altText: text("alt_text").notNull(),
    /** Where the rest of a batch's full-resolution set lives — an external
     * album (Google Photos, Flickr, etc.), shared across every photo
     * submitted in the same batch. Optional: a single photo needs no album. */
    albumUrl: text("album_url"),
    status: text("status")
      .$type<ClubPhotoStatus>()
      .default("pending")
      .notNull(),
    submittedById: text("submitted_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    submittedAt: integer("submitted_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    reviewedById: text("reviewed_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    reviewedAt: integer("reviewed_at", { mode: "timestamp_ms" }),
    reviewNote: text("review_note"),

    /**
     * An optional tie to one piece of related content a CMS reviewer can
     * attach while managing the photo - "this gallery is from the Science
     * Fair" (an event), "...is the cover shot for this article" (a news
     * post), or "...documents this achievement". At most one of the three
     * id columns is set, matching `linkedKind`; `club_photo_linked_fields_paired`
     * makes any other combination unrepresentable. All three default to
     * unlinked - most photos relate to nothing in particular, and the public
     * gallery view falls back to a plain gallery with no related-content
     * block when that is the case.
     */
    linkedKind: text("linked_kind").$type<ClubPhotoLinkKind>(),
    linkedNewsId: text("linked_news_id").references(() => newsPost.id, {
      onDelete: "set null",
    }),
    linkedEventId: text("linked_event_id").references(() => event.id, {
      onDelete: "set null",
    }),
    linkedAchievementId: text("linked_achievement_id").references(
      () => achievement.id,
      { onDelete: "set null" }
    ),
  },
  (table) => [
    index("club_photo_club_status_idx").on(table.club, table.status),
    index("club_photo_file_idx").on(table.fileId),
    index("club_photo_submitted_by_idx").on(table.submittedById),
    check("club_photo_club_check", sqlInList(table.club, CLUBS)),
    check(
      "club_photo_status_check",
      sqlInList(table.status, clubPhotoStatusSchema.options)
    ),
    check(
      "club_photo_review_fields_paired",
      sql`(${table.status} = 'pending' and ${table.reviewedById} is null and ${table.reviewedAt} is null)
          or (${table.status} <> 'pending' and ${table.reviewedById} is not null and ${table.reviewedAt} is not null)`
    ),
    check(
      "club_photo_album_url_http",
      sql`${table.albumUrl} is null or ${table.albumUrl} like 'http://%' or ${table.albumUrl} like 'https://%'`
    ),
    check(
      "club_photo_linked_kind_check",
      sql`${table.linkedKind} is null or ${sqlInList(table.linkedKind, CLUB_PHOTO_LINK_KINDS)}`
    ),
    check(
      "club_photo_linked_fields_paired",
      sql`(${table.linkedKind} is null and ${table.linkedNewsId} is null and ${table.linkedEventId} is null and ${table.linkedAchievementId} is null)
          or (${table.linkedKind} = 'news' and ${table.linkedNewsId} is not null and ${table.linkedEventId} is null and ${table.linkedAchievementId} is null)
          or (${table.linkedKind} = 'event' and ${table.linkedEventId} is not null and ${table.linkedNewsId} is null and ${table.linkedAchievementId} is null)
          or (${table.linkedKind} = 'achievement' and ${table.linkedAchievementId} is not null and ${table.linkedNewsId} is null and ${table.linkedEventId} is null)`
    ),
  ]
);

const clubPhotoColumnRefinements = {
  id: () => clubPhotoIdSchema,
  club: () => clubSlugSchema,
  fileId: () => fileIdSchema,
  caption: () => v.pipe(v.string(), v.minLength(1), v.maxLength(280)),
  altText: () => v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  albumUrl: () =>
    v.optional(
      v.nullable(
        v.pipe(
          v.string(),
          v.url(),
          v.regex(/^https?:\/\//u, "Must be an http or https URL")
        )
      )
    ),
  status: () => clubPhotoStatusSchema,
  submittedById: () => v.string(),
  reviewedById: () => v.optional(v.nullable(v.string())),
  reviewNote: () =>
    v.optional(v.nullable(v.pipe(v.string(), v.maxLength(1000)))),
  linkedKind: () => v.optional(v.nullable(clubPhotoLinkKindSchema)),
  linkedNewsId: () => v.optional(v.nullable(v.string())),
  linkedEventId: () => v.optional(v.nullable(v.string())),
  linkedAchievementId: () => v.optional(v.nullable(v.string())),
};

export const clubPhotoSelectSchema = createSelectSchema(
  clubPhoto,
  clubPhotoColumnRefinements
);
export const clubPhotoInsertSchema = createInsertSchema(
  clubPhoto,
  clubPhotoColumnRefinements
);
export const clubPhotoUpdateSchema = createUpdateSchema(
  clubPhoto,
  clubPhotoColumnRefinements
);

export type ClubPhoto = v.InferOutput<typeof clubPhotoSelectSchema>;

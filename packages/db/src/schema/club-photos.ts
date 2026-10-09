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

export type GalleryId = Brand<string, "GalleryId">;
export const galleryIdSchema = v.pipe(v.string(), brand<string, "GalleryId">());

export type ClubPhotoId = Brand<string, "ClubPhotoId">;
export const clubPhotoIdSchema = v.pipe(
  v.string(),
  brand<string, "ClubPhotoId">()
);

export const galleryStatusSchema = v.picklist([
  "pending",
  "approved",
  "rejected",
]);
export type GalleryStatus = v.InferOutput<typeof galleryStatusSchema>;

export const GALLERY_LINK_KINDS = ["news", "event", "achievement"] as const;
export type GalleryLinkKind = (typeof GALLERY_LINK_KINDS)[number];
export const galleryLinkKindSchema = v.picklist(GALLERY_LINK_KINDS);

/**
 * A named collection of photos - "Sports Day 2026", "Science Fair" - and the
 * unit the public gallery review actually happens at. Review used to be
 * per-photo; it is per-gallery now, because a reviewer deciding whether
 * twelve photos from the same event belong on the site was always making one
 * decision about the batch, not twelve independent ones about each frame.
 *
 * Two ways a gallery comes to exist:
 *  - **Club-submitted**: `club.createGallery` by the photography-admin seat.
 *    `club` is set, `status` starts `pending`, and nothing in it reaches the
 *    public gallery until a CMS reviewer (`admin` or `cms`) approves it.
 *  - **CMS-direct**: `cms.createGallery` by CMS staff. `club` is `null`,
 *    `status` is `approved` immediately, with the author standing in as their
 *    own reviewer - the same pattern `announcement`/`event`/`news_post` use,
 *    for the same reason: a CMS seat does not need to approve its own work.
 *
 * `gallery_review_fields_paired` makes "approved with no reviewer" and
 * "still pending but reviewed" both unrepresentable.
 */
export const gallery = sqliteTable(
  "gallery",
  {
    id: text("id").primaryKey(),

    /** Which club submitted this gallery, if any. `null` for a CMS-direct
     * gallery - there is no submitting club to attribute it to. */
    club: text("club"),

    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description"),

    /** Where the rest of a full-resolution set lives - an external album
     * (Google Photos, Flickr, etc.), shared across every photo in the
     * gallery. Optional. */
    albumUrl: text("album_url"),

    /** The gallery's own cover photograph - separate from its regular
     * photos, so a card or hero can show one deliberate image rather than
     * guessing at "the first one uploaded". Optional: a gallery with no
     * cover set falls back to its first photo wherever one is shown. */
    coverImageId: text("cover_image_id").references(() => files.id, {
      onDelete: "set null",
    }),

    status: text("status").$type<GalleryStatus>().default("pending").notNull(),

    createdById: text("created_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),

    reviewedById: text("reviewed_by_id").references(() => user.id, {
      onDelete: "set null",
    }),
    reviewedAt: integer("reviewed_at", { mode: "timestamp_ms" }),
    reviewNote: text("review_note"),

    publishedAt: integer("published_at", { mode: "timestamp_ms" }),

    /**
     * An optional tie to one piece of related content - "this gallery is
     * from the Science Fair" (an event), "...is the photo set for this
     * article" (a news post), or "...documents this achievement". At most
     * one of the three id columns is set, matching `linkedKind`;
     * `gallery_linked_fields_paired` makes any other combination
     * unrepresentable. All three default to unlinked - most galleries relate
     * to nothing in particular, and the public page falls back to a plain
     * gallery with no related-content block when that is the case.
     */
    linkedKind: text("linked_kind").$type<GalleryLinkKind>(),
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

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("gallery_club_status_idx").on(table.club, table.status),
    index("gallery_published_idx").on(table.publishedAt),
    index("gallery_created_by_idx").on(table.createdById),
    check(
      "gallery_club_check",
      sql`${table.club} is null or ${sqlInList(table.club, CLUBS)}`
    ),
    check(
      "gallery_status_check",
      sqlInList(table.status, galleryStatusSchema.options)
    ),
    check(
      "gallery_review_fields_paired",
      sql`(${table.status} = 'pending' and ${table.reviewedById} is null and ${table.reviewedAt} is null)
          or (${table.status} <> 'pending' and ${table.reviewedById} is not null and ${table.reviewedAt} is not null)`
    ),
    check(
      "gallery_album_url_http",
      sql`${table.albumUrl} is null or ${table.albumUrl} like 'http://%' or ${table.albumUrl} like 'https://%'`
    ),
    check(
      "gallery_linked_kind_check",
      sql`${table.linkedKind} is null or ${sqlInList(table.linkedKind, GALLERY_LINK_KINDS)}`
    ),
    check(
      "gallery_linked_fields_paired",
      sql`(${table.linkedKind} is null and ${table.linkedNewsId} is null and ${table.linkedEventId} is null and ${table.linkedAchievementId} is null)
          or (${table.linkedKind} = 'news' and ${table.linkedNewsId} is not null and ${table.linkedEventId} is null and ${table.linkedAchievementId} is null)
          or (${table.linkedKind} = 'event' and ${table.linkedEventId} is not null and ${table.linkedNewsId} is null and ${table.linkedAchievementId} is null)
          or (${table.linkedKind} = 'achievement' and ${table.linkedAchievementId} is not null and ${table.linkedNewsId} is null and ${table.linkedEventId} is null)`
    ),
  ]
);

const galleryColumnRefinements = {
  id: () => galleryIdSchema,
  club: () => v.optional(v.nullable(clubSlugSchema)),
  slug: () => v.pipe(v.string(), v.minLength(1)),
  title: () => v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  description: () =>
    v.optional(v.nullable(v.pipe(v.string(), v.maxLength(2000)))),
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
  coverImageId: () => v.optional(v.nullable(fileIdSchema)),
  status: () => galleryStatusSchema,
  createdById: () => v.string(),
  reviewedById: () => v.optional(v.nullable(v.string())),
  reviewNote: () =>
    v.optional(v.nullable(v.pipe(v.string(), v.maxLength(1000)))),
  linkedKind: () => v.optional(v.nullable(galleryLinkKindSchema)),
  linkedNewsId: () => v.optional(v.nullable(v.string())),
  linkedEventId: () => v.optional(v.nullable(v.string())),
  linkedAchievementId: () => v.optional(v.nullable(v.string())),
};

export const gallerySelectSchema = createSelectSchema(
  gallery,
  galleryColumnRefinements
);
export const galleryInsertSchema = createInsertSchema(
  gallery,
  galleryColumnRefinements
);
export const galleryUpdateSchema = createUpdateSchema(
  gallery,
  galleryColumnRefinements
);

export type Gallery = v.InferOutput<typeof gallerySelectSchema>;

/**
 * One photo inside a `gallery`. Carries no review state of its own - the
 * gallery it belongs to is the entire publish gate. Deleting a gallery takes
 * every one of its photos with it (`onDelete: "cascade"`), the same way a
 * withdrawn/rejected gallery leaves nothing behind for the public query to
 * find even a trace of.
 */
export const clubPhoto = sqliteTable(
  "club_photo",
  {
    id: text("id").primaryKey(),
    galleryId: text("gallery_id")
      .notNull()
      .references(() => gallery.id, { onDelete: "cascade" }),
    fileId: text("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "cascade" }),
    caption: text("caption").notNull(),
    altText: text("alt_text").notNull(),
    submittedById: text("submitted_by_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    submittedAt: integer("submitted_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("club_photo_gallery_idx").on(table.galleryId),
    index("club_photo_file_idx").on(table.fileId),
    index("club_photo_submitted_by_idx").on(table.submittedById),
  ]
);

const clubPhotoColumnRefinements = {
  id: () => clubPhotoIdSchema,
  galleryId: () => galleryIdSchema,
  fileId: () => fileIdSchema,
  caption: () => v.pipe(v.string(), v.minLength(1), v.maxLength(280)),
  altText: () => v.pipe(v.string(), v.minLength(1), v.maxLength(200)),
  submittedById: () => v.string(),
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

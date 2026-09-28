import { sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-orm/valibot";
import * as v from "valibot";

import { brand } from "./brand";
import type { Brand } from "./brand";
import { club, clubIdSchema } from "./clubs";
import { files } from "./files";
import { isoDateSchema } from "./primitives";

export type GalleryId = Brand<string, "GalleryId">;
export const galleryIdSchema = v.pipe(v.string(), brand<string, "GalleryId">());

export type GalleryItemId = Brand<string, "GalleryItemId">;
export const galleryItemIdSchema = v.pipe(
  v.string(),
  brand<string, "GalleryItemId">()
);

export type GalleryLinkId = Brand<string, "GalleryLinkId">;
export const galleryLinkIdSchema = v.pipe(
  v.string(),
  brand<string, "GalleryLinkId">()
);

/**
 * The three flavours of gallery. Each has its own detail table
 * (`photo_gallery`, `art_gallery`, `digital_gallery`) so kind-specific fields
 * are typed rather than shoe-horned into nullable columns on one table.
 */
export const GALLERY_KINDS = ["photo", "art", "digital"] as const;
export type GalleryKind = (typeof GALLERY_KINDS)[number];

/**
 * A gallery row only exists once the CMS has approved it - pending edits live
 * in `global_content_submission`. `archived` keeps the row (and its items) for
 * the audit trail while dropping it from every public query.
 */
export const GALLERY_STATUSES = ["published", "archived"] as const;
export type GalleryStatus = (typeof GALLERY_STATUSES)[number];

/** Delivery medium for a digital gallery entry. */
export const DIGITAL_FORMATS = ["video", "animation", "vr", "webgl"] as const;
export type DigitalFormat = (typeof DIGITAL_FORMATS)[number];

/**
 * What a gallery can be attached to.
 *
 * `person` and `exhibition` have no tables yet - they are listed here so the
 * link table can start accepting them the moment those schemas land, without a
 * migration. `sport` is deliberately absent: sports get their own schema, and
 * adding the value is a one-line change here when it exists.
 *
 * The two club-owned targets, `clubEvent` and `clubAchievement`, are the ones a
 * club actually reaches for: they are how the photographs of an event the club
 * ran get found from the event, and how the photographs of a result the club
 * won get found from the result. They are separate values rather than extensions
 * of `event` and `achievement` because the underlying tables are separate and
 * differently owned - see `LINK_TARGET_RESOLVERS` in the API, which is the one
 * place that has to agree with this list.
 */
export const GALLERY_LINK_TARGETS = [
  "person",
  "event",
  "achievement",
  "exhibition",
  "clubEvent",
  "clubAchievement",
] as const;
export type GalleryLinkTarget = (typeof GALLERY_LINK_TARGETS)[number];

/**
 * The job an image does inside its gallery, and therefore the crop it is
 * composed for.
 *
 * The same photograph is asked to do three incompatible things: represent the
 * gallery in a list (`cover`, 3:2), span the full width of a gallery page
 * (`banner`, 16:9), and sit in a masonry grid among its peers (`item`, 1:1).
 * Without a declared role the renderer has to guess from context, and the same
 * upload crops three different ways depending on which screen it lands on.
 *
 * `cover` and `banner` are one-per-gallery and that is a database constraint, not
 * a hope - see the partial unique indexes below. `item` is unbounded.
 */
export const GALLERY_IMAGE_ROLES = ["item", "cover", "banner"] as const;
export type GalleryImageRole = (typeof GALLERY_IMAGE_ROLES)[number];

/**
 * Hard cap on how many items of one gallery may be promoted to the homepage
 * and other pages. Enforced by the database, not by application code: see the
 * `gallery_item` checks and partial unique indexes.
 */
export const MAX_TRENDING_GALLERY_ITEMS = 5;

/**
 * A site-level gallery.
 *
 * Scope note: galleries are *global* content - they are addressable from the
 * homepage and any page - but the photography club curates the photo galleries.
 * `ownerClubId` records that curation right, and because every write still goes
 * through a submission, a club can never publish to a global gallery on its
 * own. This is deliberately the only global-scope table a club controls.
 */
export const gallery = sqliteTable(
  "gallery",
  {
    id: text("id").primaryKey(),

    /** URL segment, unique site-wide, e.g. "interact-2026". */
    slug: text("slug").notNull().unique(),

    kind: text("kind").$type<GalleryKind>().notNull(),

    title: text("title").notNull(),
    summary: text("summary"),

    /**
     * The club allowed to curate this gallery. Null means CMS-authored with no
     * club attached (e.g. an art gallery run by a teacher).
     */
    ownerClubId: text("owner_club_id").references(() => club.id, {
      onDelete: "set null",
    }),

    /**
     * Off-site album this gallery continues into - a Facebook album, a Flickr
     * set, anything. A club's best photographs are usually too many and too
     * large to host here, so this is how a gallery says "there is more, over
     * there" without pretending to be the more.
     *
     * Optional, and deliberately a bare URL rather than a stored embed: the
     * publisher changes, the terms change, and a stored copy of someone else's
     * page is both stale and theirs.
     */
    albumUrl: text("album_url"),
    /** What the link is called, e.g. "See the full album on Facebook". */
    albumLabel: text("album_label"),

    status: text("status")
      .$type<GalleryStatus>()
      .notNull()
      .default("published"),

    publishedAt: integer("published_at", { mode: "timestamp_ms" }),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),

    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("gallery_kind_idx").on(table.kind),
    index("gallery_ownerClub_idx").on(table.ownerClubId),
    index("gallery_status_idx").on(table.status),
  ]
);

/**
 * Photo-specific gallery fields (table-per-subtype: `galleryId` is both the
 * primary key and the foreign key, so a gallery has at most one of these).
 */
export const photoGallery = sqliteTable("photo_gallery", {
  galleryId: text("gallery_id")
    .primaryKey()
    .references(() => gallery.id, { onDelete: "cascade" }),

  /** Date the shoot happened. */
  shotOn: text("shot_on"),

  location: text("location"),

  camera: text("camera"),
  lens: text("lens"),

  /** Free-form exposure note, e.g. "f/1.8 1/250s ISO 400". */
  exposure: text("exposure"),
});

/** Art-specific gallery fields. */
export const artGallery = sqliteTable("art_gallery", {
  galleryId: text("gallery_id")
    .primaryKey()
    .references(() => gallery.id, { onDelete: "cascade" }),

  /** Physical medium, e.g. "oil on canvas", "watercolour". */
  medium: text("medium"),

  artist: text("artist"),

  /** Gallery or hall the work is currently shown in. */
  venue: text("venue"),

  year: integer("year"),
});

/** Digital-content-specific gallery fields. */
export const digitalGallery = sqliteTable("digital_gallery", {
  galleryId: text("gallery_id")
    .primaryKey()
    .references(() => gallery.id, { onDelete: "cascade" }),

  format: text("format").$type<DigitalFormat>().notNull(),

  durationSeconds: integer("duration_seconds"),

  /** Still frame shown before the entry is played. */
  posterImageId: text("poster_image_id").references(() => files.id, {
    onDelete: "set null",
  }),
});

/**
 * A single media entry inside a gallery.
 *
 * Homepage promotion is flag-based rather than a separate table, and the two
 * rules that matter are constraints, not application checks:
 *
 * - At most one cover per gallery - the partial unique index on `is_cover = 1`.
 * - At most `MAX_TRENDING_GALLERY_ITEMS` trending items per gallery, ranked
 *   1..5 - the partial unique index on `(gallery_id, trending_position)` plus
 *   the range check on the position.
 *
 * Both a `create` and an `edit` of these flags arrive as a submission, so a
 * club cannot promote its own image to the homepage without CMS approval.
 */
export const galleryItem = sqliteTable(
  "gallery_item",
  {
    id: text("id").primaryKey(),

    galleryId: text("gallery_id")
      .notNull()
      .references(() => gallery.id, { onDelete: "cascade" }),

    fileId: text("file_id")
      .notNull()
      .references(() => files.id, { onDelete: "cascade" }),

    caption: text("caption"),

    /** Required for accessibility - every published image needs a description. */
    altText: text("alt_text").notNull(),

    /** Manual ordering within the gallery. */
    position: integer("position").notNull().default(0),

    /**
     * The job this image does, and so the crop it is composed for. See
     * `GALLERY_IMAGE_ROLES`. `isCover` below is derived from this rather than
     * set independently, so there is only ever one way to say "this is the
     * cover" and the two can never disagree.
     */
    imageRole: text("image_role")
      .$type<GalleryImageRole>()
      .notNull()
      .default("item"),

    /** The one image that represents the gallery. */
    isCover: integer("is_cover", { mode: "boolean" }).notNull().default(false),

    /** Promoted to the homepage and other pages. */
    isTrending: integer("is_trending", { mode: "boolean" })
      .notNull()
      .default(false),

    /**
     * 1-based homepage rank. Required when `is_trending` and forbidden when
     * not, so a trending item can never be left unranked.
     */
    trendingPosition: integer("trending_position"),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),

    updatedAt: integer("updated_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("galleryItem_gallery_idx").on(table.galleryId),
    index("galleryItem_file_idx").on(table.fileId),
    index("galleryItem_gallery_position_idx").on(
      table.galleryId,
      table.position
    ),

    /*
     * At most one cover and at most one banner per gallery. Both are partial
     * unique indexes, so the rule holds even if two approved submissions race
     * - which they can, since each is a separate reviewer action.
     */
    uniqueIndex("galleryItem_cover_uq")
      .on(table.galleryId)
      .where(sql`${table.isCover} = 1`),

    uniqueIndex("galleryItem_bannerRole_uq")
      .on(table.galleryId)
      .where(sql`${table.imageRole} = 'banner'`),

    uniqueIndex("galleryItem_trendingPosition_uq")
      .on(table.galleryId, table.trendingPosition)
      .where(sql`${table.isTrending} = 1`),

    check(
      "galleryItem_trendingPosition_range",
      sql`${table.trendingPosition} between 1 and ${sql.raw(
        String(MAX_TRENDING_GALLERY_ITEMS)
      )}`
    ),

    check(
      "galleryItem_trendingPosition_required",
      sql`(${table.isTrending} = 1 and ${table.trendingPosition} is not null) or (${table.isTrending} = 0 and ${table.trendingPosition} is null)`
    ),

    /*
     * `isCover` is derived from `imageRole` on the way in, and this constraint
     * is what stops the two drifting apart if anything ever writes the column
     * directly: a row cannot claim to be the cover without also saying so in
     * its role.
     */
    check(
      "galleryItem_cover_follows_role",
      sql`(${table.imageRole} = 'cover' and ${table.isCover} = 1) or (${table.imageRole} <> 'cover' and ${table.isCover} = 0)`
    ),
  ]
);

/**
 * Attaches a gallery to another subject on the site: a person, a club event, an
 * exhibition.
 *
 * Deliberately polymorphic with no foreign key on `target_id`. The alternative -
 * one link table per target - means a migration and a new API branch every time
 * a new subject is linkable, and the user-facing question ("show me the events
 * in this gallery") is answered by one indexed lookup on `(target, target_id)`.
 * The trade-off is that the database cannot stop a dangling `target_id`, so the
 * API validates the target exists before accepting a submission.
 */
export const galleryLink = sqliteTable(
  "gallery_link",
  {
    id: text("id").primaryKey(),

    galleryId: text("gallery_id")
      .notNull()
      .references(() => gallery.id, { onDelete: "cascade" }),

    target: text("target").$type<GalleryLinkTarget>().notNull(),

    /** Id in the table named by `target` - polymorphic, hence untyped. */
    targetId: text("target_id").notNull(),

    createdAt: integer("created_at", { mode: "timestamp_ms" })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
  },
  (table) => [
    index("galleryLink_gallery_idx").on(table.galleryId),
    index("galleryLink_target_idx").on(table.target, table.targetId),
    uniqueIndex("galleryLink_gallery_target_uq").on(
      table.galleryId,
      table.target,
      table.targetId
    ),
  ]
);

/**
 * Whether a string is an absolute `http`/`https` URL.
 *
 * `http`/`https` only, not merely "something that parses as a URL": this value
 * is rendered as a link on a public page, and a `javascript:` or `data:` URL
 * that reached a submission would be a stored injection the moment a reviewer
 * approved it. Parsed rather than pattern-matched so the check cannot be fooled
 * by `javascript:` smuggled behind a lookalike prefix.
 */
const isHttpUrl = (value: string) => {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
};

export const gallerySelectSchema = createSelectSchema(gallery, {
  id: () => galleryIdSchema,
  ownerClubId: () => v.nullable(clubIdSchema),
  kind: () => v.picklist(GALLERY_KINDS),
  status: () => v.picklist(GALLERY_STATUSES),
});
export const galleryInsertSchema = createInsertSchema(gallery, {
  id: () => galleryIdSchema,
  slug: () => v.pipe(v.string(), v.minLength(1)),
  kind: () => v.picklist(GALLERY_KINDS),
  title: () => v.pipe(v.string(), v.minLength(1)),
  status: () => v.picklist(GALLERY_STATUSES),
  ownerClubId: () => v.optional(v.nullable(clubIdSchema)),
  albumUrl: () =>
    v.optional(
      v.nullable(
        v.pipe(
          v.string(),
          v.trim(),
          v.maxLength(500),
          v.check(isHttpUrl, "Must be an http or https URL")
        )
      )
    ),
  albumLabel: () =>
    v.optional(
      v.nullable(
        v.pipe(
          v.string(),
          v.transform((label) => label.trim()),
          v.maxLength(120)
        )
      )
    ),
});

export const photoGallerySelectSchema = createSelectSchema(photoGallery, {
  galleryId: () => galleryIdSchema,
  shotOn: () => v.optional(v.nullable(isoDateSchema)),
});
export const photoGalleryInsertSchema = createInsertSchema(photoGallery, {
  galleryId: () => galleryIdSchema,
  shotOn: () => v.optional(v.nullable(isoDateSchema)),
});

export const artGallerySelectSchema = createSelectSchema(artGallery, {
  galleryId: () => galleryIdSchema,
});
export const artGalleryInsertSchema = createInsertSchema(artGallery, {
  galleryId: () => galleryIdSchema,
});

export const digitalGallerySelectSchema = createSelectSchema(digitalGallery, {
  galleryId: () => galleryIdSchema,
  format: () => v.picklist(DIGITAL_FORMATS),
});
export const digitalGalleryInsertSchema = createInsertSchema(digitalGallery, {
  galleryId: () => galleryIdSchema,
  format: () => v.picklist(DIGITAL_FORMATS),
});

export const galleryItemSelectSchema = createSelectSchema(galleryItem, {
  id: () => galleryItemIdSchema,
  galleryId: () => galleryIdSchema,
  imageRole: () => v.picklist(GALLERY_IMAGE_ROLES),
});
export const galleryItemInsertSchema = createInsertSchema(galleryItem, {
  id: () => galleryItemIdSchema,
  galleryId: () => galleryIdSchema,
  altText: () => v.pipe(v.string(), v.minLength(1)),
  imageRole: () => v.optional(v.picklist(GALLERY_IMAGE_ROLES)),
  trendingPosition: () =>
    v.optional(
      v.nullable(
        v.pipe(
          v.number(),
          v.integer(),
          v.minValue(1),
          v.maxValue(MAX_TRENDING_GALLERY_ITEMS)
        )
      )
    ),
});

export const galleryLinkSelectSchema = createSelectSchema(galleryLink, {
  id: () => galleryLinkIdSchema,
  galleryId: () => galleryIdSchema,
  target: () => v.picklist(GALLERY_LINK_TARGETS),
});
export const galleryLinkInsertSchema = createInsertSchema(galleryLink, {
  id: () => galleryLinkIdSchema,
  galleryId: () => galleryIdSchema,
  target: () => v.picklist(GALLERY_LINK_TARGETS),
  targetId: () => v.pipe(v.string(), v.minLength(1)),
});

export type Gallery = v.InferOutput<typeof gallerySelectSchema>;
export type GalleryItem = v.InferOutput<typeof galleryItemSelectSchema>;
export type GalleryLink = v.InferOutput<typeof galleryLinkSelectSchema>;

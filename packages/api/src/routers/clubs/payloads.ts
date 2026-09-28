import { announcementIdSchema } from "@aloysius/db/schema/announcements";
import {
  clubAchievementIdSchema,
  clubAnnouncementIdSchema,
  clubEventIdSchema,
} from "@aloysius/db/schema/clubContent";
import { fileIdSchema } from "@aloysius/db/schema/files";
import {
  DIGITAL_FORMATS,
  GALLERY_IMAGE_ROLES,
  GALLERY_KINDS,
  GALLERY_LINK_TARGETS,
  GALLERY_STATUSES,
  galleryIdSchema,
  galleryItemIdSchema,
  MAX_TRENDING_GALLERY_ITEMS,
} from "@aloysius/db/schema/gallery";
import { isoDateSchema } from "@aloysius/db/schema/primitives";
import {
  achievementIdSchema,
  eventIdSchema,
  personIdSchema,
} from "@aloysius/db/schema/root-content";
import * as v from "valibot";

/**
 * Payload shapes for club submissions.
 *
 * Every value that lands in a live content table passes through one of these
 * first, on the way in as a submission - and the same schema is re-used when
 * the payload is parsed back out for approval, so a payload that was valid at
 * submit time cannot be applied in a shape the tables do not expect.
 *
 * Each target gets a `create` and an `update` variant: the required fields of a
 * new row are genuinely required, while an edit only carries what changed.
 */

const nullableText = v.nullable(v.string());
const nullableId = v.nullable(v.pipe(v.string(), v.minLength(1)));
const nullableDate = v.nullish(v.date());

/**
 * An off-site album URL.
 *
 * `http`/`https` only, not merely "a string that parses as a URL": this value
 * is rendered as a link on a public page, and a `javascript:` or `data:` URL
 * that reached a submission would be a stored injection the moment a reviewer
 * approved it. Parsed rather than pattern-matched so the check cannot be fooled
 * by a dangerous scheme hidden behind a lookalike prefix.
 */
const albumUrlSchema = v.pipe(
  v.string(),
  v.trim(),
  v.maxLength(500),
  v.check((value) => {
    try {
      const { protocol } = new URL(value);
      return protocol === "http:" || protocol === "https:";
    } catch {
      return false;
    }
  }, "Must be an http or https URL")
);

const albumLabelSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(120)
);

// ─── Gallery ─────────────────────────────────────────────────────────────────

/** Photo-shoot metadata. Only meaningful on a gallery of kind "photo". */
const photoDetailsSchema = v.object({
  shotOn: v.optional(v.nullable(isoDateSchema)),
  location: v.optional(nullableText),
  camera: v.optional(nullableText),
  lens: v.optional(nullableText),
  exposure: v.optional(nullableText),
});

const artDetailsSchema = v.object({
  medium: v.optional(nullableText),
  artist: v.optional(nullableText),
  venue: v.optional(nullableText),
  year: v.optional(
    v.nullable(v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(9999)))
  ),
});

const digitalDetailsSchema = v.object({
  format: v.optional(v.picklist(DIGITAL_FORMATS)),
  durationSeconds: v.optional(
    v.nullable(v.pipe(v.number(), v.integer(), v.minValue(0)))
  ),
  posterImageId: v.optional(nullableId),
});

export const galleryCreatePayloadSchema = v.object({
  /** Pre-generated so the submission can name the row it will become. */
  id: galleryIdSchema,
  slug: v.pipe(v.string(), v.minLength(1)),
  kind: v.picklist(GALLERY_KINDS),
  title: v.pipe(v.string(), v.minLength(1)),
  summary: v.optional(nullableText),
  /** Off-site album this gallery continues into. See `gallery.albumUrl`. */
  albumUrl: v.optional(v.nullable(albumUrlSchema)),
  albumLabel: v.optional(v.nullable(albumLabelSchema)),
  photo: v.optional(photoDetailsSchema),
  art: v.optional(artDetailsSchema),
  digital: v.optional(digitalDetailsSchema),
});

/**
 * `kind` is absent from the update shape on purpose: changing it would orphan
 * the existing detail row in `photo_gallery` / `art_gallery` /
 * `digital_gallery`, so it is immutable after creation.
 */
export const galleryUpdatePayloadSchema = v.object({
  slug: v.optional(v.pipe(v.string(), v.minLength(1))),
  title: v.optional(v.pipe(v.string(), v.minLength(1))),
  summary: v.optional(nullableText),
  albumUrl: v.optional(v.nullable(albumUrlSchema)),
  albumLabel: v.optional(v.nullable(albumLabelSchema)),
  status: v.optional(v.picklist(GALLERY_STATUSES)),
  photo: v.optional(photoDetailsSchema),
  art: v.optional(artDetailsSchema),
  digital: v.optional(digitalDetailsSchema),
});

// ─── Gallery item ────────────────────────────────────────────────────────────

const trendingPositionSchema = v.pipe(
  v.number(),
  v.integer(),
  v.minValue(1),
  v.maxValue(MAX_TRENDING_GALLERY_ITEMS)
);

export const galleryItemCreatePayloadSchema = v.object({
  id: galleryItemIdSchema,
  galleryId: galleryIdSchema,
  fileId: fileIdSchema,
  altText: v.pipe(v.string(), v.minLength(1)),
  caption: v.optional(nullableText),
  position: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
  /**
   * The job this image does, and so the crop it is composed for. `isCover` is
   * not in the payload: the applier derives it from this, so there is one way
   * to say "this is the cover" rather than two that can disagree.
   */
  imageRole: v.optional(v.picklist(GALLERY_IMAGE_ROLES)),
  isTrending: v.optional(v.boolean()),
  trendingPosition: v.optional(trendingPositionSchema),
});

export const galleryItemUpdatePayloadSchema = v.object({
  fileId: v.optional(fileIdSchema),
  altText: v.optional(v.pipe(v.string(), v.minLength(1))),
  caption: v.optional(nullableText),
  position: v.optional(v.pipe(v.number(), v.integer(), v.minValue(0))),
  imageRole: v.optional(v.picklist(GALLERY_IMAGE_ROLES)),
  isTrending: v.optional(v.boolean()),
  trendingPosition: v.optional(v.nullable(trendingPositionSchema)),
});

export const galleryLinkCreatePayloadSchema = v.object({
  galleryId: v.optional(galleryIdSchema),
  target: v.picklist(GALLERY_LINK_TARGETS),
  targetId: v.pipe(v.string(), v.minLength(1)),
});

export const personCreatePayloadSchema = v.object({
  id: personIdSchema,
  slug: v.pipe(v.string(), v.minLength(1)),
  name: v.pipe(v.string(), v.minLength(1)),
  role: v.optional(nullableText),
  bio: v.optional(nullableText),
  imageId: v.optional(nullableId),
});

export const personUpdatePayloadSchema = v.partial(
  v.omit(personCreatePayloadSchema, ["id"])
);

export const eventCreatePayloadSchema = v.object({
  id: eventIdSchema,
  slug: v.pipe(v.string(), v.minLength(1)),
  title: v.pipe(v.string(), v.minLength(1)),
  description: v.optional(nullableText),
  location: v.optional(nullableText),
  startsAt: v.pipe(
    isoDateSchema,
    v.transform((value) => new Date(`${value}T00:00:00.000Z`))
  ),
  endsAt: v.optional(
    v.nullish(
      v.pipe(
        isoDateSchema,
        v.transform((value) => new Date(`${value}T00:00:00.000Z`))
      )
    )
  ),
  coverImageId: v.optional(nullableId),
});

export const eventUpdatePayloadSchema = v.partial(
  v.omit(eventCreatePayloadSchema, ["id"])
);

export const achievementCreatePayloadSchema = v.object({
  id: achievementIdSchema,
  category: v.pipe(v.string(), v.minLength(1)),
  title: v.pipe(v.string(), v.minLength(1)),
  detail: v.pipe(v.string(), v.minLength(1)),
  imageId: v.optional(nullableId),
});

export const achievementUpdatePayloadSchema = v.partial(
  v.omit(achievementCreatePayloadSchema, ["id"])
);

// ─── Club event ──────────────────────────────────────────────────────────────

export const clubEventCreatePayloadSchema = v.object({
  id: clubEventIdSchema,
  slug: v.pipe(v.string(), v.minLength(1)),
  title: v.pipe(v.string(), v.minLength(1)),
  description: v.optional(nullableText),
  location: v.optional(nullableText),
  startsAt: v.date(),
  endsAt: v.date(),
  coverImageId: v.optional(fileIdSchema),
});

export const clubEventUpdatePayloadSchema = v.object({
  slug: v.optional(v.pipe(v.string(), v.minLength(1))),
  title: v.optional(v.pipe(v.string(), v.minLength(1))),
  description: v.optional(nullableText),
  location: v.optional(nullableText),
  startsAt: v.optional(v.date()),
  endsAt: v.optional(v.date()),
  coverImageId: v.optional(fileIdSchema),
});

// ─── Club announcement ───────────────────────────────────────────────────────

export const clubAnnouncementCreatePayloadSchema = v.object({
  id: clubAnnouncementIdSchema,
  title: v.pipe(v.string(), v.minLength(1)),
  body: v.pipe(v.string(), v.minLength(1)),
  imageId: v.optional(fileIdSchema),
  /**
   * Link to a school-wide announcement this club is amplifying. Approval-gated
   * with the rest of the payload: putting global wording in front of a club
   * audience is exactly the kind of change a reviewer should see.
   */
  globalAnnouncementId: v.optional(announcementIdSchema),
  effectiveFrom: v.optional(nullableDate),
  expiresAt: v.optional(nullableDate),
});

export const clubAnnouncementUpdatePayloadSchema = v.object({
  title: v.optional(v.pipe(v.string(), v.minLength(1))),
  body: v.optional(v.pipe(v.string(), v.minLength(1))),
  imageId: v.optional(fileIdSchema),
  globalAnnouncementId: v.optional(announcementIdSchema),
  effectiveFrom: v.optional(nullableDate),
  expiresAt: v.optional(nullableDate),
});

// ─── Club achievement ─────────────────────────────────────────────────────────

/**
 * Something the club itself achieved.
 *
 * `title` is the only required field because the other three are the ones a
 * club genuinely does not always have: a result logged weeks later may have no
 * tidy date, and a category is only worth entering if the club volunteers one.
 */
export const clubAchievementCreatePayloadSchema = v.object({
  id: clubAchievementIdSchema,
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(160)),
  detail: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(1000)))),
  category: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(80)))),
  achievedOn: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(80)))),
  imageId: v.optional(nullableId),
});

export const clubAchievementUpdatePayloadSchema = v.object({
  title: v.optional(v.pipe(v.string(), v.minLength(1), v.maxLength(160))),
  detail: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(1000)))),
  category: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(80)))),
  achievedOn: v.optional(v.nullable(v.pipe(v.string(), v.maxLength(80)))),
  imageId: v.optional(nullableId),
});

// ─── Club profile ────────────────────────────────────────────────────────────

/**
 * A club may edit its own profile, and only these presentation fields - the
 * slug and name stay CMS-owned because other content references them.
 *
 * The image fields are nullable rather than merely optional, and that distinction
 * is the point: `undefined` means "leave this alone", `null` means "take the
 * banner down". Without it a club could put a cover image up and could never
 * replace or remove it, which is the same as not being able to change it.
 *
 * The club row itself carries the banner, not a gallery, so a club's identity
 * survives having no approved content at all - and a club's own cover banner is
 * the one image about the club that is not reviewed as part of a gallery, so it
 * is the one image that needs an explicit "remove" rather than an implicit one.
 */
export const clubUpdatePayloadSchema = v.object({
  description: v.optional(nullableText),
  coverImageId: v.optional(v.nullable(fileIdSchema)),
  backgroundImageId: v.optional(v.nullable(fileIdSchema)),
});

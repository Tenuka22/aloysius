import type { Database } from "@aloysius/db";
import {
  clubContentSubmission,
  globalContentSubmission,
} from "@aloysius/db/schema/approvals";
import type {
  ClubContentSubmission,
  GlobalContentSubmission,
} from "@aloysius/db/schema/approvals";
import {
  clubAchievement,
  clubAnnouncement,
  clubEvent,
} from "@aloysius/db/schema/clubContent";
import { club } from "@aloysius/db/schema/clubs";
import {
  artGallery,
  digitalGallery,
  gallery,
  galleryItem,
  galleryLink,
  photoGallery,
} from "@aloysius/db/schema/gallery";
import { achievement, event, person } from "@aloysius/db/schema/root-content";
import { ORPCError } from "@orpc/server";
import { eq } from "drizzle-orm";
import * as v from "valibot";

import { findHardcodedClub } from "./config";
import type { DbLike } from "./db";
import { assertLinkTargetExists } from "./link-targets";
import {
  clubAchievementCreatePayloadSchema,
  clubAchievementUpdatePayloadSchema,
  clubAnnouncementCreatePayloadSchema,
  clubAnnouncementUpdatePayloadSchema,
  clubEventCreatePayloadSchema,
  clubEventUpdatePayloadSchema,
  clubUpdatePayloadSchema,
  galleryCreatePayloadSchema,
  galleryItemCreatePayloadSchema,
  galleryItemUpdatePayloadSchema,
  galleryUpdatePayloadSchema,
  galleryLinkCreatePayloadSchema,
  achievementCreatePayloadSchema,
  achievementUpdatePayloadSchema,
  eventCreatePayloadSchema,
  eventUpdatePayloadSchema,
  personCreatePayloadSchema,
  personUpdatePayloadSchema,
} from "./payloads";

/**
 * Applying an approved submission to the live content tables.
 *
 * Two rules govern everything here:
 *
 * 1. **Nothing in this file runs before a reviewer approves.** It is reached
 *    only from `reviewSubmission`, and the content write and the status flip
 *    share one transaction - so a submission can never be applied twice, and a
 *    failed write leaves the submission `pending` rather than half-applied.
 * 2. **Partial updates patch, they do not replace.** A submission for a caption
 *    edit must not blank the alt text. Every applier spreads the payload over
 *    the existing row, and drizzle skips `undefined` values in a partial set.
 *
 * The database constraints (one cover per gallery, five trending per gallery)
 * are the last line of defence. When one rejects an otherwise valid approval -
 * the reviewer promoted an image a pending item already covers - the error is
 * re-thrown with the constraint name so the CMS can show something actionable.
 */

const parsePayload = <T extends v.GenericSchema>(
  schema: T,
  raw: string
): v.InferOutput<T> => {
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: "Submission payload is not valid JSON",
    });
  }

  const result = v.safeParse(schema, parsedJson);
  if (!result.success) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Submission payload failed re-validation",
      cause: result.issues,
    });
  }
  return result.output;
};

const requireTargetId = (targetId: string | null, target: string): string => {
  if (!targetId) {
    throw new ORPCError("INTERNAL_SERVER_ERROR", {
      message: `Submission for ${target} has an operation that needs a target id, but carries none`,
    });
  }
  return targetId;
};

/**
 * Turn a database constraint violation into a message a CMS editor can act on.
 * The names checked here are the index and check names declared in
 * `schema/gallery.ts`; if one is renamed, this needs the same rename.
 */
const rethrowAsConflict = (error: unknown): never => {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("galleryItem_cover_uq")) {
    throw new ORPCError("CONFLICT", {
      message:
        "That gallery already has a cover image. Clear the current cover first, or reject the competing pending submission.",
    });
  }
  if (message.includes("galleryItem_trendingPosition_uq")) {
    throw new ORPCError("CONFLICT", {
      message:
        "That trending slot is already taken in this gallery. Trending items are capped at five per gallery.",
    });
  }
  if (message.includes("galleryItem_trendingPosition_range")) {
    throw new ORPCError("BAD_REQUEST", {
      message: "A trending position must be between 1 and 5.",
    });
  }
  if (message.includes("galleryItem_trendingPosition_required")) {
    throw new ORPCError("BAD_REQUEST", {
      message:
        "A trending item must carry a 1-5 position, and an item that is not trending must not have one.",
    });
  }

  throw new ORPCError("INTERNAL_SERVER_ERROR", {
    message: "Failed to apply the approved submission",
    cause: error,
  });
};

// ─── Global targets ──────────────────────────────────────────────────────────

const applyGallery = async (
  db: DbLike,
  submission: GlobalContentSubmission
) => {
  if (submission.operation === "create") {
    const payload = parsePayload(
      galleryCreatePayloadSchema,
      submission.payload
    );
    const hasDetails =
      (payload.kind === "photo" && payload.photo) ||
      (payload.kind === "art" && payload.art) ||
      (payload.kind === "digital" && payload.digital);
    if (!hasDetails) {
      throw new ORPCError("BAD_REQUEST", {
        message: `A ${payload.kind} gallery must include its detail payload`,
      });
    }

    await db.transaction(async (tx) => {
      await tx.insert(gallery).values({
        id: payload.id,
        slug: payload.slug,
        kind: payload.kind,
        title: payload.title,
        summary: payload.summary,
        albumUrl: payload.albumUrl ?? null,
        albumLabel: payload.albumLabel ?? null,
        ownerClubId: submission.submittedByClubId,
        status: "published",
        publishedAt: new Date(),
      });

      // Exactly one detail row, in the table that matches the kind. An `else if`
      // chain rather than a `switch` so a new kind is a compile error here.
      if (payload.kind === "photo") {
        await tx.insert(photoGallery).values({
          galleryId: payload.id,
          ...payload.photo,
        });
      } else if (payload.kind === "art") {
        await tx.insert(artGallery).values({
          galleryId: payload.id,
          ...payload.art,
        });
      } else {
        await tx.insert(digitalGallery).values({
          galleryId: payload.id,
          format: payload.digital?.format ?? "video",
          durationSeconds: payload.digital?.durationSeconds,
          posterImageId: payload.digital?.posterImageId,
        });
      }
    });
    return;
  }

  const targetId = requireTargetId(submission.targetId, "gallery");

  if (submission.operation === "delete") {
    // Items and links cascade; the audit trail is the submission row itself.
    await db.delete(gallery).where(eq(gallery.id, targetId));
    return;
  }

  const payload = parsePayload(galleryUpdatePayloadSchema, submission.payload);
  const { photo, art, digital, ...fields } = payload;

  await db.transaction(async (tx) => {
    await tx.update(gallery).set(fields).where(eq(gallery.id, targetId));

    if (photo) {
      await tx
        .update(photoGallery)
        .set(photo)
        .where(eq(photoGallery.galleryId, targetId));
    }
    if (art) {
      await tx
        .update(artGallery)
        .set(art)
        .where(eq(artGallery.galleryId, targetId));
    }
    if (digital) {
      await tx
        .update(digitalGallery)
        .set(digital)
        .where(eq(digitalGallery.galleryId, targetId));
    }
  });
};

// oxlint-disable-next-line eslint/complexity
const applyGalleryItem = async (
  db: DbLike,
  submission: GlobalContentSubmission
) => {
  if (submission.operation === "create") {
    const payload = parsePayload(
      galleryItemCreatePayloadSchema,
      submission.payload
    );

    if (submission.submittedByClubId) {
      const owner = await db
        .select({ ownerClubId: gallery.ownerClubId })
        .from(gallery)
        .where(eq(gallery.id, payload.galleryId))
        .get();
      if (!owner || owner.ownerClubId !== submission.submittedByClubId) {
        throw new ORPCError("FORBIDDEN", {
          message: "A club may only add items to its own gallery",
        });
      }
    }

    await db.insert(galleryItem).values({
      id: payload.id,
      galleryId: payload.galleryId,
      fileId: payload.fileId,
      altText: payload.altText,
      caption: payload.caption,
      position: payload.position ?? 0,
      // `isCover` is derived, never submitted: the payload says what job the
      // image does and the column follows. Two ways to say "cover" is two ways
      // to be wrong, and the database check enforces that they agree.
      imageRole: payload.imageRole ?? "item",
      isCover: (payload.imageRole ?? "item") === "cover",
      isTrending: payload.isTrending ?? false,
      // The flag and the rank are one decision: never leave a trending item
      // unranked, even if the payload omitted the position.
      trendingPosition: payload.isTrending
        ? (payload.trendingPosition ?? 1)
        : null,
    });
    return;
  }

  const targetId = requireTargetId(submission.targetId, "galleryItem");

  const current = await db
    .select({
      galleryId: galleryItem.galleryId,
      imageRole: galleryItem.imageRole,
      isCover: galleryItem.isCover,
      isTrending: galleryItem.isTrending,
      trendingPosition: galleryItem.trendingPosition,
    })
    .from(galleryItem)
    .where(eq(galleryItem.id, targetId))
    .get();

  if (submission.submittedByClubId) {
    const owner = current
      ? await db
          .select({ ownerClubId: gallery.ownerClubId })
          .from(gallery)
          .where(eq(gallery.id, current.galleryId))
          .get()
      : null;
    if (!owner || owner.ownerClubId !== submission.submittedByClubId) {
      throw new ORPCError("FORBIDDEN", {
        message: "A club may only edit items in its own gallery",
      });
    }
  }

  if (submission.operation === "delete") {
    await db.delete(galleryItem).where(eq(galleryItem.id, targetId));
    return;
  }

  const payload = parsePayload(
    galleryItemUpdatePayloadSchema,
    submission.payload
  );

  const { isTrending: currentIsTrending, trendingPosition: currentPosition } =
    current ?? {};
  const isTrending = payload.isTrending ?? currentIsTrending ?? false;

  // Rank resolution, in priority order: an explicit position in the payload
  // wins; otherwise keep the current rank, unless the item has just been
  // promoted (default to 1) or just been demoted (clear it).
  const { trendingPosition: requestedPosition } = payload;
  let trendingPosition = requestedPosition;
  if (trendingPosition === undefined) {
    trendingPosition = isTrending ? (currentPosition ?? 1) : null;
  }

  await db
    .update(galleryItem)
    .set({
      fileId: payload.fileId,
      altText: payload.altText,
      caption: payload.caption,
      position: payload.position,
      // Same derivation as create: the role is the input, `isCover` follows.
      // An update that omits the role keeps the current one rather than
      // silently demoting the cover to an ordinary item.
      imageRole: payload.imageRole ?? current?.imageRole ?? "item",
      isCover: (payload.imageRole ?? current?.imageRole ?? "item") === "cover",
      isTrending: payload.isTrending,
      trendingPosition,
    })
    .where(eq(galleryItem.id, targetId));
};

const applyPerson = async (db: DbLike, submission: GlobalContentSubmission) => {
  if (submission.operation === "create") {
    const payload = parsePayload(personCreatePayloadSchema, submission.payload);
    await db.insert(person).values({ ...payload, publishedAt: new Date() });
    return;
  }
  const targetId = requireTargetId(submission.targetId, "person");
  if (submission.operation === "delete") {
    await db.delete(person).where(eq(person.id, targetId));
    return;
  }
  await db
    .update(person)
    .set(parsePayload(personUpdatePayloadSchema, submission.payload))
    .where(eq(person.id, targetId));
};

const applyEvent = async (db: DbLike, submission: GlobalContentSubmission) => {
  if (submission.operation === "create") {
    const payload = parsePayload(eventCreatePayloadSchema, submission.payload);
    await db.insert(event).values({ ...payload, publishedAt: new Date() });
    return;
  }
  const targetId = requireTargetId(submission.targetId, "event");
  if (submission.operation === "delete") {
    await db.delete(event).where(eq(event.id, targetId));
    return;
  }
  await db
    .update(event)
    .set(parsePayload(eventUpdatePayloadSchema, submission.payload))
    .where(eq(event.id, targetId));
};

const applyAchievement = async (
  db: DbLike,
  submission: GlobalContentSubmission
) => {
  if (submission.operation === "create") {
    const payload = parsePayload(
      achievementCreatePayloadSchema,
      submission.payload
    );
    await db
      .insert(achievement)
      .values({ ...payload, publishedAt: new Date() });
    return;
  }
  const targetId = requireTargetId(submission.targetId, "achievement");
  if (submission.operation === "delete") {
    await db.delete(achievement).where(eq(achievement.id, targetId));
    return;
  }
  await db
    .update(achievement)
    .set(parsePayload(achievementUpdatePayloadSchema, submission.payload))
    .where(eq(achievement.id, targetId));
};

const applyGalleryLink = async (
  db: DbLike,
  submission: GlobalContentSubmission
) => {
  if (submission.operation === "delete") {
    const targetId = requireTargetId(submission.targetId, "galleryLink");
    await db.delete(galleryLink).where(eq(galleryLink.id, targetId));
    return;
  }
  if (submission.operation !== "create") {
    throw new ORPCError("BAD_REQUEST", {
      message: "Gallery links can only be created or deleted",
    });
  }
  const payload = parsePayload(
    galleryLinkCreatePayloadSchema,
    submission.payload
  );
  if (!payload.galleryId) {
    throw new ORPCError("BAD_REQUEST", {
      message: "A gallery link must identify its gallery",
    });
  }
  if (submission.submittedByClubId) {
    const owner = await db
      .select({ ownerClubId: gallery.ownerClubId })
      .from(gallery)
      .where(eq(gallery.id, payload.galleryId))
      .get();
    if (!owner || owner.ownerClubId !== submission.submittedByClubId) {
      throw new ORPCError("FORBIDDEN", {
        message: "A club may only link its own gallery",
      });
    }
  }

  /*
   * Re-checked here, and through the same shared list the submit handler uses.
   * The queue can sit for days and the target tables are CMS-authored, so a
   * target that existed when the club submitted may be gone by the time a
   * reviewer approves. An earlier version of this inlined only two of the three
   * targets, which meant an `achievement` link could be submitted, approved, and
   * then fail on a record that existed.
   */
  await assertLinkTargetExists(db, payload.target, payload.targetId);

  await db.insert(galleryLink).values({
    id: crypto.randomUUID(),
    galleryId: payload.galleryId,
    target: payload.target,
    targetId: payload.targetId,
  });
};

// ─── Club targets ────────────────────────────────────────────────────────────

/**
 * A club's own presentation fields.
 *
 * Two things happen here that are worth stating.
 *
 * First, the row is created if it is missing. The `club` registry row is
 * otherwise only written when an administrator's credentials are issued, which
 * means a club whose cover banner was approved before anyone had signed in would
 * update zero rows and appear to have been approved anyway. Seeding from
 * `HARDCODED_CLUBS` is safe precisely because the club identity is not
 * client-supplied: `submission.clubId` was resolved from the signed-in
 * administrator's username, and only the presentation fields come from the
 * payload.
 *
 * Second, a `null` image id is a removal, not a no-op. Drizzle skips `undefined`
 * in a partial set, so passing the payload straight through already distinguishes
 * "leave it" from "take it down" - see `clubUpdatePayloadSchema`.
 */
const applyClub = async (db: DbLike, submission: ClubContentSubmission) => {
  const payload = parsePayload(clubUpdatePayloadSchema, submission.payload);
  const { clubId } = submission;

  const existing = await db
    .select({ id: club.id })
    .from(club)
    .where(eq(club.id, clubId))
    .get();

  if (!existing) {
    const configured = findHardcodedClub(clubId);
    if (!configured) {
      throw new ORPCError("BAD_REQUEST", {
        message: "That club is not one this site knows about",
      });
    }
    await db.insert(club).values({
      id: configured.id,
      name: configured.name,
      slug: configured.slug,
      status: configured.status,
    });
  }

  await db.update(club).set(payload).where(eq(club.id, clubId));
};

/**
 * A club achievement. Scoped to `submission.clubId` exactly as `clubEvent` and
 * `clubAnnouncement` are, and never to a `clubId` from the payload - that is the
 * whole point of putting it in the club queue rather than the global one.
 */
const applyClubAchievement = async (
  db: DbLike,
  submission: ClubContentSubmission
) => {
  if (submission.operation === "create") {
    const payload = parsePayload(
      clubAchievementCreatePayloadSchema,
      submission.payload
    );
    await db.insert(clubAchievement).values({
      id: payload.id,
      achievedOn: payload.achievedOn ?? null,
      category: payload.category ?? null,
      clubId: submission.clubId,
      detail: payload.detail ?? null,
      imageId: payload.imageId ?? null,
      publishedAt: new Date(),
      title: payload.title,
    });
    return;
  }

  const targetId = requireTargetId(submission.targetId, "clubAchievement");

  if (submission.operation === "delete") {
    await db.delete(clubAchievement).where(eq(clubAchievement.id, targetId));
    return;
  }

  const payload = parsePayload(
    clubAchievementUpdatePayloadSchema,
    submission.payload
  );
  await db
    .update(clubAchievement)
    .set(payload)
    .where(eq(clubAchievement.id, targetId));
};

const applyClubEvent = async (
  db: DbLike,
  submission: ClubContentSubmission
) => {
  if (submission.operation === "create") {
    const payload = parsePayload(
      clubEventCreatePayloadSchema,
      submission.payload
    );
    await db.insert(clubEvent).values({
      id: payload.id,
      clubId: submission.clubId,
      slug: payload.slug,
      title: payload.title,
      description: payload.description,
      location: payload.location,
      startsAt: payload.startsAt,
      endsAt: payload.endsAt,
      coverImageId: payload.coverImageId,
      publishedAt: new Date(),
    });
    return;
  }

  const targetId = requireTargetId(submission.targetId, "clubEvent");

  if (submission.operation === "delete") {
    await db.delete(clubEvent).where(eq(clubEvent.id, targetId));
    return;
  }

  const payload = parsePayload(
    clubEventUpdatePayloadSchema,
    submission.payload
  );
  await db.update(clubEvent).set(payload).where(eq(clubEvent.id, targetId));
};

const applyClubAnnouncement = async (
  db: DbLike,
  submission: ClubContentSubmission
) => {
  if (submission.operation === "create") {
    const payload = parsePayload(
      clubAnnouncementCreatePayloadSchema,
      submission.payload
    );
    await db.insert(clubAnnouncement).values({
      id: payload.id,
      clubId: submission.clubId,
      title: payload.title,
      body: payload.body,
      imageId: payload.imageId,
      globalAnnouncementId: payload.globalAnnouncementId,
      effectiveFrom: payload.effectiveFrom,
      expiresAt: payload.expiresAt,
      publishedAt: new Date(),
    });
    return;
  }

  const targetId = requireTargetId(submission.targetId, "clubAnnouncement");

  if (submission.operation === "delete") {
    await db.delete(clubAnnouncement).where(eq(clubAnnouncement.id, targetId));
    return;
  }

  const payload = parsePayload(
    clubAnnouncementUpdatePayloadSchema,
    submission.payload
  );
  await db
    .update(clubAnnouncement)
    .set(payload)
    .where(eq(clubAnnouncement.id, targetId));
};

// ─── Entry points ────────────────────────────────────────────────────────────

/** Apply an approved global submission, then mark it approved - atomically. */
export const approveGlobalSubmission = async (
  db: Database,
  submission: GlobalContentSubmission,
  reviewerId: string
) => {
  const apply = {
    gallery: applyGallery,
    galleryItem: applyGalleryItem,
    person: applyPerson,
    event: applyEvent,
    achievement: applyAchievement,
    galleryLink: applyGalleryLink,
  }[submission.target];

  try {
    await db.transaction(async (tx) => {
      await apply(tx, submission);
      await tx
        .update(globalContentSubmission)
        .set({
          status: "approved",
          reviewedById: reviewerId,
          reviewedAt: new Date(),
        })
        .where(eq(globalContentSubmission.id, submission.id));
    });
  } catch (error) {
    if (error instanceof ORPCError) {
      throw error;
    }
    rethrowAsConflict(error);
  }
};

/** Apply an approved club submission, then mark it approved - atomically. */
export const approveClubSubmission = async (
  db: Database,
  submission: ClubContentSubmission,
  reviewerId: string
) => {
  const apply = {
    club: applyClub,
    clubEvent: applyClubEvent,
    clubAnnouncement: applyClubAnnouncement,
    clubAchievement: applyClubAchievement,
  }[submission.target];

  try {
    await db.transaction(async (tx) => {
      await apply(tx, submission);
      await tx
        .update(clubContentSubmission)
        .set({
          status: "approved",
          reviewedById: reviewerId,
          reviewedAt: new Date(),
        })
        .where(eq(clubContentSubmission.id, submission.id));
    });
  } catch (error) {
    if (error instanceof ORPCError) {
      throw error;
    }
    rethrowAsConflict(error);
  }
};

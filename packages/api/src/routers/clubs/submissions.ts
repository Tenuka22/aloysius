import type { Database } from "@aloysius/db";
import { announcement } from "@aloysius/db/schema/announcements";
import {
  clubContentSubmission,
  globalContentSubmission,
} from "@aloysius/db/schema/approvals";
import { user } from "@aloysius/db/schema/auth";
import { clubAnnouncement, clubEvent } from "@aloysius/db/schema/clubContent";
import { club } from "@aloysius/db/schema/clubs";
import { gallery, galleryItem, galleryLink } from "@aloysius/db/schema/gallery";
import { ORPCError } from "@orpc/server";
import { and, desc, eq } from "drizzle-orm";
import * as v from "valibot";

import { protectedProcedure, requireClubPermission } from "../../index";
import { findClubByAdminUsername, findHardcodedClub } from "./config";
import { assertLinkTargetExists, linkTargetTitle } from "./link-targets";
/**
 * The club side of the approval workflow.
 *
 * Nothing in this file writes to a content table. Every handler turns a club
 * member's intent into a submission row, and `apply.ts` - reached only from
 * `adminClubs.approve` - is the only path that touches live content. Three
 * consequences worth stating explicitly:
 *
 * - A club can queue changes to its own galleries, its own events and its own
 *   announcements. It cannot touch another club's, and it cannot touch the
 *   global announcement set at all.
 * - Re-submitting supersedes. A pending-submission unique index means a second
 *   submission for the same target replaces the first, so a reviewer never sees
 *   two competing versions and the club's latest intent is the one reviewed.
 * - `baseSnapshot` is captured at submit time, so the review UI can diff the
 *   proposal against the live row without re-deriving what "live" meant when
 *   the club pressed submit.
 *
 * No handler here takes a `clubId`. The club is resolved from the signed-in
 * administrator's username on every request, so there is no field a client can
 * get wrong and no endpoint where the check can be forgotten.
 */
import {
  clubAchievementCreatePayloadSchema,
  clubAnnouncementCreatePayloadSchema,
  clubAnnouncementUpdatePayloadSchema,
  clubEventCreatePayloadSchema,
  clubEventUpdatePayloadSchema,
  eventCreatePayloadSchema,
  achievementCreatePayloadSchema,
  personCreatePayloadSchema,
  clubUpdatePayloadSchema,
  galleryCreatePayloadSchema,
  galleryItemCreatePayloadSchema,
  galleryItemUpdatePayloadSchema,
  galleryLinkCreatePayloadSchema,
  galleryUpdatePayloadSchema,
} from "./payloads";

const clubAdminProcedure = requireClubPermission("submit");

const idInput = v.pipe(v.string(), v.minLength(1));
const deleteInput = v.optional(v.boolean());

/**
 * A `gallery_link` target has to exist before a submission naming it is worth
 * a reviewer's time. The table is polymorphic with no foreign key, so this is
 * the only place that fact can be checked - and the list of linkable targets
 * lives in `./link-targets` so the submit handler and the applier cannot
 * disagree about it.
 */
const assertClubAdmin = async (
  db: Database,
  userId: string,
  clubId: string
) => {
  const hardcodedClub = findHardcodedClub(clubId);
  const admin = await db
    .select({ username: user.username, banned: user.banned })
    .from(user)
    .where(eq(user.id, userId))
    .get();

  if (
    !hardcodedClub ||
    !admin ||
    admin.username !== hardcodedClub.adminUsername
  ) {
    throw new ORPCError("FORBIDDEN", {
      message: "You are not the administrator of that club",
    });
  }
  if (admin.banned) {
    throw new ORPCError("FORBIDDEN", {
      message: "This club administrator is banned from submitting content",
    });
  }
};

/**
 * The club the signed-in user administers, derived from their username.
 *
 * Every submission procedure uses this and takes no `clubId` at all. The older
 * shape accepted a `clubId` and then checked it against the username, which is
 * safe but asks the client for something the server already knows - and in
 * practice the clients got it wrong: the event, announcement and gallery forms
 * all sent `clubId: ""`, so `findHardcodedClub("")` found nothing and every one
 * of those submissions failed with "You are not the administrator of that club".
 * Deriving it here removes the possibility of the check being forgotten, and
 * removes the field from the request entirely.
 */
const requireOwnClubId = (username: string | null | undefined) => {
  const configured = findClubByAdminUsername(username);
  if (!configured) {
    throw new ORPCError("FORBIDDEN", {
      message: "This account does not administer a club",
    });
  }
  return configured.id;
};

/**
 * The caller's own club id, and the assertion that their account may submit.
 *
 * `assertClubAdmin` re-reads the user row rather than trusting the session, so a
 * ban takes effect on the next request instead of at the next sign-in.
 */
const ownClubScope = async (
  db: Database,
  userId: string,
  username: string | null | undefined
): Promise<string> => {
  const clubId = requireOwnClubId(username);
  await assertClubAdmin(db, userId, clubId);
  return clubId;
};

/**
 * Assert the caller may curate this gallery, and return its owning club id.
 *
 * A gallery with no owner club is CMS-authored - a club has no claim on it, so
 * this fails rather than silently allowing any member of any club to submit
 * against it.
 */
const assertOwnsGallery = async (
  db: Database,
  galleryId: string,
  userId: string
): Promise<string> => {
  const row = await db
    .select({ ownerClubId: gallery.ownerClubId })
    .from(gallery)
    .where(eq(gallery.id, galleryId))
    .get();

  if (!row) {
    throw new ORPCError("NOT_FOUND", { message: "Gallery not found" });
  }
  if (!row.ownerClubId) {
    throw new ORPCError("FORBIDDEN", {
      message: "That gallery has no club owner, so a club cannot edit it",
    });
  }

  await assertClubAdmin(db, userId, row.ownerClubId);
  return row.ownerClubId;
};

const assertPayloadOrDelete = (
  payload: unknown,
  isDelete: boolean | undefined,
  subject: string
) => {
  if (isDelete !== true && payload === undefined) {
    throw new ORPCError("BAD_REQUEST", {
      message: `Provide a payload to update the ${subject}, or set delete to true`,
    });
  }
};

/**
 * Withdraw a club member's own pending create for a target.
 *
 * A `create` submission has no target id, so "the same target" means the same
 * club and the same kind of thing. This is what keeps a reviewer from facing
 * three competing "new gallery" proposals when a club has changed its mind,
 * while still letting a club queue many new items at once.
 */
const supersedePendingCreate = async (
  db: Database,
  clubId: string,
  target: "clubEvent" | "clubAnnouncement"
) => {
  await db
    .update(clubContentSubmission)
    .set({ status: "withdrawn" })
    .where(
      and(
        eq(clubContentSubmission.clubId, clubId),
        eq(clubContentSubmission.target, target),
        eq(clubContentSubmission.status, "pending"),
        eq(clubContentSubmission.operation, "create")
      )
    );
};

// ─── Club-level content ──────────────────────────────────────────────────────

/** Propose a new club event. */
export const submitClubEvent = clubAdminProcedure
  .input(v.object({ payload: clubEventCreatePayloadSchema }))
  .handler(async ({ context, input }) => {
    // Checked before the club lookup: a window that ends before it starts is a
    // malformed proposal regardless of who sent it, so the caller should not have
    // to wait on a database round trip to be told.
    if (input.payload.endsAt < input.payload.startsAt) {
      throw new ORPCError("BAD_REQUEST", {
        message: "An event cannot end before it starts",
      });
    }

    const clubId = await ownClubScope(
      context.db,
      context.session.user.id,
      context.session.user.username
    );

    await supersedePendingCreate(context.db, clubId, "clubEvent");

    const submissionId = crypto.randomUUID();
    await context.db.insert(clubContentSubmission).values({
      id: submissionId,
      clubId,
      target: "clubEvent",
      targetId: null,
      operation: "create",
      payload: JSON.stringify(input.payload),
      status: "pending",
      submittedById: context.session.user.id,
    });

    return { submissionId };
  });

/** Propose a new club announcement, optionally amplifying a global one. */
export const submitClubAnnouncement = clubAdminProcedure
  .input(v.object({ payload: clubAnnouncementCreatePayloadSchema }))
  .handler(async ({ context, input }) => {
    const clubId = await ownClubScope(
      context.db,
      context.session.user.id,
      context.session.user.username
    );

    if (input.payload.globalAnnouncementId) {
      const linked = await context.db
        .select({ id: announcement.id })
        .from(announcement)
        .where(eq(announcement.id, input.payload.globalAnnouncementId))
        .get();

      if (!linked) {
        throw new ORPCError("BAD_REQUEST", {
          message: "The global announcement being linked does not exist",
        });
      }
    }

    await supersedePendingCreate(context.db, clubId, "clubAnnouncement");

    const submissionId = crypto.randomUUID();
    await context.db.insert(clubContentSubmission).values({
      id: submissionId,
      clubId,
      target: "clubAnnouncement",
      targetId: null,
      operation: "create",
      payload: JSON.stringify(input.payload),
      status: "pending",
      submittedById: context.session.user.id,
    });

    return { submissionId };
  });

/** Edit or delete one of the caller's club's events. */
export const submitClubEventUpdate = clubAdminProcedure
  .input(
    v.object({
      eventId: idInput,
      payload: v.optional(clubEventUpdatePayloadSchema),
      delete: deleteInput,
    })
  )
  .handler(async ({ context, input }) => {
    const clubId = await ownClubScope(
      context.db,
      context.session.user.id,
      context.session.user.username
    );
    assertPayloadOrDelete(input.payload, input.delete, "event");

    const current = await context.db
      .select()
      .from(clubEvent)
      .where(and(eq(clubEvent.id, input.eventId), eq(clubEvent.clubId, clubId)))
      .get();

    if (!current) {
      throw new ORPCError("NOT_FOUND", { message: "Event not found" });
    }

    const submissionId = crypto.randomUUID();
    await context.db.insert(clubContentSubmission).values({
      id: submissionId,
      clubId,
      target: "clubEvent",
      targetId: input.eventId,
      operation: input.delete === true ? "delete" : "update",
      payload: JSON.stringify(input.payload ?? {}),
      baseSnapshot: JSON.stringify(current),
      status: "pending",
      submittedById: context.session.user.id,
    });

    return { submissionId };
  });

/** Edit or delete one of the caller's club's announcements. */
export const submitClubAnnouncementUpdate = clubAdminProcedure
  .input(
    v.object({
      announcementId: idInput,
      payload: v.optional(clubAnnouncementUpdatePayloadSchema),
      delete: deleteInput,
    })
  )
  .handler(async ({ context, input }) => {
    const clubId = await ownClubScope(
      context.db,
      context.session.user.id,
      context.session.user.username
    );
    assertPayloadOrDelete(input.payload, input.delete, "announcement");

    const current = await context.db
      .select()
      .from(clubAnnouncement)
      .where(
        and(
          eq(clubAnnouncement.id, input.announcementId),
          eq(clubAnnouncement.clubId, clubId)
        )
      )
      .get();

    if (!current) {
      throw new ORPCError("NOT_FOUND", { message: "Announcement not found" });
    }

    const submissionId = crypto.randomUUID();
    await context.db.insert(clubContentSubmission).values({
      id: submissionId,
      clubId,
      target: "clubAnnouncement",
      targetId: input.announcementId,
      operation: input.delete === true ? "delete" : "update",
      payload: JSON.stringify(input.payload ?? {}),
      baseSnapshot: JSON.stringify(current),
      status: "pending",
      submittedById: context.session.user.id,
    });

    return { submissionId };
  });

/**
 * Propose an edit to the caller's own club profile - its description and its
 * cover banner.
 *
 * Only the presentation fields in `clubUpdatePayloadSchema` are editable: the
 * slug and name are CMS-owned because other content references them, and the
 * set of clubs is the hardcoded registry in `./config`. There is no `clubId` in
 * the input, so there is nothing here for a client to get wrong.
 */
export const submitClubProfileUpdate = clubAdminProcedure
  .input(v.object({ payload: clubUpdatePayloadSchema }))
  .handler(async ({ context, input }) => {
    const clubId = await ownClubScope(
      context.db,
      context.session.user.id,
      context.session.user.username
    );

    const current = await context.db
      .select()
      .from(club)
      .where(eq(club.id, clubId))
      .get();

    const submissionId = crypto.randomUUID();
    await context.db.insert(clubContentSubmission).values({
      id: submissionId,
      clubId,
      target: "club",
      targetId: clubId,
      operation: "update",
      payload: JSON.stringify(input.payload),
      baseSnapshot: current ? JSON.stringify(current) : null,
      status: "pending",
      submittedById: context.session.user.id,
    });

    return { submissionId };
  });

// ─── The global gallery, curated by a club ───────────────────────────────────

/**
 * Propose a new gallery.
 *
 * The gallery is a *global* resource, but the submitter's club is recorded as
 * its owner and the CMS still has to approve it. This is the one global-scope
 * table a club is allowed to drive.
 */
export const submitGalleryCreate = clubAdminProcedure
  .input(v.object({ payload: galleryCreatePayloadSchema }))
  .handler(async ({ context, input }) => {
    const clubId = await ownClubScope(
      context.db,
      context.session.user.id,
      context.session.user.username
    );

    const submissionId = crypto.randomUUID();
    await context.db.insert(globalContentSubmission).values({
      id: submissionId,
      target: "gallery",
      targetId: null,
      operation: "create",
      payload: JSON.stringify(input.payload),
      submittedByClubId: clubId,
      status: "pending",
      submittedById: context.session.user.id,
    });

    return { submissionId };
  });

/** Propose an edit to, or the deletion of, one of the club's galleries. */
export const submitGalleryUpdate = clubAdminProcedure
  .input(
    v.object({
      galleryId: idInput,
      payload: v.optional(galleryUpdatePayloadSchema),
      delete: deleteInput,
    })
  )
  .handler(async ({ context, input }) => {
    const ownerClubId = await assertOwnsGallery(
      context.db,
      input.galleryId,
      context.session.user.id
    );
    assertPayloadOrDelete(input.payload, input.delete, "gallery");

    const current = await context.db
      .select()
      .from(gallery)
      .where(eq(gallery.id, input.galleryId))
      .get();

    const submissionId = crypto.randomUUID();
    await context.db.insert(globalContentSubmission).values({
      id: submissionId,
      target: "gallery",
      targetId: input.galleryId,
      operation: input.delete === true ? "delete" : "update",
      payload: JSON.stringify(input.payload ?? {}),
      baseSnapshot: current ? JSON.stringify(current) : null,
      submittedByClubId: ownerClubId,
      status: "pending",
      submittedById: context.session.user.id,
    });

    return { submissionId };
  });

/** Propose adding one image to one of the club's galleries. */
export const submitGalleryItemCreate = clubAdminProcedure
  .input(
    v.object({
      galleryId: idInput,
      payload: v.omit(galleryItemCreatePayloadSchema, ["galleryId"]),
    })
  )
  .handler(async ({ context, input }) => {
    const ownerClubId = await assertOwnsGallery(
      context.db,
      input.galleryId,
      context.session.user.id
    );

    const submissionId = crypto.randomUUID();
    await context.db.insert(globalContentSubmission).values({
      id: submissionId,
      target: "galleryItem",
      targetId: null,
      operation: "create",
      payload: JSON.stringify({ ...input.payload, galleryId: input.galleryId }),
      submittedByClubId: ownerClubId,
      status: "pending",
      submittedById: context.session.user.id,
    });

    return { submissionId };
  });

/**
 * Propose an edit to, or the deletion of, one gallery image - including
 * promoting it to cover or trending, which is how an image reaches the
 * homepage. The flag is not written until a reviewer approves, so a club cannot
 * put its own shot on the homepage.
 */
export const submitGalleryItemUpdate = clubAdminProcedure
  .input(
    v.object({
      itemId: idInput,
      payload: v.optional(galleryItemUpdatePayloadSchema),
      delete: deleteInput,
    })
  )
  .handler(async ({ context, input }) => {
    const item = await context.db
      .select({ galleryId: galleryItem.galleryId })
      .from(galleryItem)
      .where(eq(galleryItem.id, input.itemId))
      .get();

    if (!item) {
      throw new ORPCError("NOT_FOUND", { message: "Gallery item not found" });
    }

    const ownerClubId = await assertOwnsGallery(
      context.db,
      item.galleryId,
      context.session.user.id
    );
    assertPayloadOrDelete(input.payload, input.delete, "image");

    const current = await context.db
      .select()
      .from(galleryItem)
      .where(eq(galleryItem.id, input.itemId))
      .get();

    const submissionId = crypto.randomUUID();
    await context.db.insert(globalContentSubmission).values({
      id: submissionId,
      target: "galleryItem",
      targetId: input.itemId,
      operation: input.delete === true ? "delete" : "update",
      payload: JSON.stringify(input.payload ?? {}),
      baseSnapshot: current ? JSON.stringify(current) : null,
      submittedByClubId: ownerClubId,
      status: "pending",
      submittedById: context.session.user.id,
    });

    return { submissionId };
  });

/**
 * Attaches a gallery to another subject: a person, a school event, a school-wide
 * achievement, or one of the caller's own club events and achievements.
 *
 * The link table is polymorphic and carries no foreign key on `target_id`, so
 * the target is validated here instead. A dangling link is worse than a rejected
 * submission, because the gallery page would render a link to nothing.
 *
 * Note `targetId: null`. The gallery this link belongs to travels inside the
 * payload, not in the submission's `targetId`: a `create` names a row that does
 * not exist yet, and `globalContentSubmission_create_has_no_target` requires
 * `targetId` to be null for one. Passing the gallery id there made every gallery
 * link fail its own constraint.
 */
export const submitGalleryLinkCreate = clubAdminProcedure
  .input(
    v.object({
      galleryId: idInput,
      payload: galleryLinkCreatePayloadSchema,
    })
  )
  .handler(async ({ context, input }) => {
    const ownerClubId = await assertOwnsGallery(
      context.db,
      input.galleryId,
      context.session.user.id
    );

    await assertLinkTargetExists(
      context.db,
      input.payload.target,
      input.payload.targetId
    );

    const submissionId = crypto.randomUUID();
    await context.db.insert(globalContentSubmission).values({
      id: submissionId,
      target: "galleryLink",
      targetId: null,
      operation: "create",
      payload: JSON.stringify({
        ...input.payload,
        galleryId: input.galleryId,
      }),
      submittedByClubId: ownerClubId,
      status: "pending",
      submittedById: context.session.user.id,
    });

    return { submissionId };
  });

/** The slice of a procedure context that a submit helper needs. */
interface SubmitScope {
  db: Database;
  session: { user: { id: string; username?: string | null } };
}

/**
 * Detach a gallery from something it was linked to.
 *
 * The mirror of `submitGalleryLinkCreate`, and it was missing in a way that left
 * the club portal in a dead end. The applier has always handled
 * `operation: "delete"` for a `galleryLink`, but nothing could submit one, so
 * once a link existed it was permanent. That matters most for the links a club
 * cannot fix any other way: `gallery_link` has no foreign key, so a target that
 * is deleted leaves a row pointing at nothing, and `listMyGalleryLinks` reports it
 * as "the record it pointed at no longer exists" - accurate, and not actionable
 * without this endpoint.
 *
 * Ownership is resolved through the link's own gallery, not from a `galleryId` in
 * the input, so there is no way to name a link belonging to another club. The
 * gallery is read to build the diff a reviewer sees; the delete itself only needs
 * the link id.
 */
export const submitGalleryLinkDelete = clubAdminProcedure
  .input(v.object({ linkId: idInput }))
  .handler(async ({ context, input }) => {
    const link = await context.db
      .select({
        id: galleryLink.id,
        galleryId: galleryLink.galleryId,
        target: galleryLink.target,
        targetId: galleryLink.targetId,
      })
      .from(galleryLink)
      .where(eq(galleryLink.id, input.linkId))
      .get();

    if (!link) {
      throw new ORPCError("NOT_FOUND", {
        message: "That link no longer exists",
      });
    }

    await assertOwnsGallery(
      context.db,
      link.galleryId,
      context.session.user.id
    );

    /*
     * Resolved now, not at approval time, purely so the reviewer can see what is
     * being unlinked. `linkTargetTitle` returns null for a target that has since
     * been deleted, and that is the expected case here rather than a fault: it
     * is exactly the row this endpoint exists to clear.
     */
    const targetTitle = await linkTargetTitle(
      context.db,
      link.target,
      link.targetId
    );

    const submissionId = crypto.randomUUID();
    await context.db.insert(globalContentSubmission).values({
      id: submissionId,
      target: "galleryLink",
      targetId: link.id,
      operation: "delete",
      payload: JSON.stringify({ removedTargetTitle: targetTitle }),
      baseSnapshot: JSON.stringify({ ...link, targetTitle }),
      submittedByClubId: await ownClubScope(
        context.db,
        context.session.user.id,
        context.session.user.username
      ),
      status: "pending",
      submittedById: context.session.user.id,
    });

    return { submissionId };
  });

const submitRootCreate = async (
  context: SubmitScope,
  target: "person" | "event" | "achievement",
  payload: unknown
) => {
  const clubId = await ownClubScope(
    context.db,
    context.session.user.id,
    context.session.user.username
  );
  const submissionId = crypto.randomUUID();
  await context.db.insert(globalContentSubmission).values({
    id: submissionId,
    target,
    targetId: null,
    operation: "create",
    payload: JSON.stringify(payload),
    submittedByClubId: clubId,
    status: "pending",
    submittedById: context.session.user.id,
  });
  return { submissionId };
};

export const submitPersonCreate = clubAdminProcedure
  .input(v.object({ payload: personCreatePayloadSchema }))
  .handler(({ context, input }) =>
    submitRootCreate(context, "person", input.payload)
  );

export const submitEventCreate = clubAdminProcedure
  .input(v.object({ payload: eventCreatePayloadSchema }))
  .handler(({ context, input }) =>
    submitRootCreate(context, "event", input.payload)
  );

export const submitAchievementCreate = clubAdminProcedure
  .input(v.object({ payload: achievementCreatePayloadSchema }))
  .handler(({ context, input }) =>
    submitRootCreate(context, "achievement", input.payload)
  );

// ─── Queue visibility ────────────────────────────────────────────────────────

/** Everything the caller has in flight, across all of their clubs. */
export const listMySubmissions = clubAdminProcedure.handler(
  async ({ context }) => {
    const [global, clubScoped] = await Promise.all([
      context.db
        .select()
        .from(globalContentSubmission)
        .where(
          and(
            eq(globalContentSubmission.submittedById, context.session.user.id),
            eq(globalContentSubmission.status, "pending")
          )
        )
        .orderBy(desc(globalContentSubmission.submittedAt))
        .all(),
      context.db
        .select()
        .from(clubContentSubmission)
        .where(
          and(
            eq(clubContentSubmission.submittedById, context.session.user.id),
            eq(clubContentSubmission.status, "pending")
          )
        )
        .orderBy(desc(clubContentSubmission.submittedAt))
        .all(),
    ]);

    return { global, club: clubScoped };
  }
);

/** Propose recording something the club itself achieved. */
export const submitClubAchievement = clubAdminProcedure
  .input(v.object({ payload: clubAchievementCreatePayloadSchema }))
  .handler(async ({ context, input }) => {
    const clubId = await ownClubScope(
      context.db,
      context.session.user.id,
      context.session.user.username
    );

    const submissionId = crypto.randomUUID();
    await context.db.insert(clubContentSubmission).values({
      id: submissionId,
      target: "clubAchievement",
      targetId: null,
      operation: "create",
      payload: JSON.stringify(input.payload),
      clubId,
      status: "pending",
      submittedById: context.session.user.id,
    });

    return { submissionId };
  });

/** Withdraw a pending submission. Only the submitter can withdraw, and only
 * while it is still pending - once reviewed, the row is history. */
export const withdrawGlobalSubmission = protectedProcedure
  .input(v.object({ submissionId: idInput }))
  .handler(async ({ context, input }) => {
    const changed = await context.db
      .update(globalContentSubmission)
      .set({ status: "withdrawn" })
      .where(
        and(
          eq(globalContentSubmission.id, input.submissionId),
          eq(globalContentSubmission.submittedById, context.session.user.id),
          eq(globalContentSubmission.status, "pending")
        )
      )
      .run();

    if (changed.rowsAffected === 0) {
      throw new ORPCError("NOT_FOUND", {
        message: "No pending submission of yours with that id",
      });
    }

    return { withdrawn: true };
  });

/** Club-scoped counterpart to `withdrawGlobalSubmission`. */
export const withdrawClubSubmission = protectedProcedure
  .input(v.object({ submissionId: idInput }))
  .handler(async ({ context, input }) => {
    const changed = await context.db
      .update(clubContentSubmission)
      .set({ status: "withdrawn" })
      .where(
        and(
          eq(clubContentSubmission.id, input.submissionId),
          eq(clubContentSubmission.submittedById, context.session.user.id),
          eq(clubContentSubmission.status, "pending")
        )
      )
      .run();

    if (changed.rowsAffected === 0) {
      throw new ORPCError("NOT_FOUND", {
        message: "No pending submission of yours with that id",
      });
    }

    return { withdrawn: true };
  });

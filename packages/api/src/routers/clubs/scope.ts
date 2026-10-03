import { announcement } from "@aloysius/db/schema/announcements";
import {
  clubAchievement,
  clubAnnouncement,
  clubEvent,
} from "@aloysius/db/schema/clubContent";
import { club } from "@aloysius/db/schema/clubs";
import { gallery, galleryItem, galleryLink } from "@aloysius/db/schema/gallery";
import { achievement, event } from "@aloysius/db/schema/root-content";
import { ORPCError } from "@orpc/server";
import { and, asc, count, desc, eq, inArray, ne } from "drizzle-orm";
import * as v from "valibot";

import { protectedProcedure } from "../../index";
import { listOffset, listParamsSchema, sortDirectionOf } from "../list-params";
import { findClubByAdminUsername } from "./config";
import type { DbLike } from "./db";
import { resolveFileUrls, withImageUrls } from "./file-urls";
import { linkTargetTitle } from "./link-targets";

/**
 * The club a signed-in administrator runs, resolved from their username.
 *
 * The binding is derived server-side on every request, never taken from the
 * client. A `?club=` parameter would let the administrator of one club read and
 * write another, which is exactly the failure `specs/CLUB-ARCHITECTURE` calls
 * out as a success criterion: "a request from another club admin cannot target
 * Photography Club".
 *
 * The registry row is joined in for the display name and slug, which are
 * CMS-editable, while the binding itself stays in the hardcoded config.
 */
/**
 * The signed-in administrator's club, or forbidden.
 *
 * Every procedure in this file starts here, and none of them names a club in its
 * input. The binding is derived from the username on every request, never taken
 * from the client.
 */
const requireOwnClub = (username: string | null | undefined) => {
  const configured = findClubByAdminUsername(username);
  if (!configured) {
    throw new ORPCError("FORBIDDEN", {
      message: "This account does not administer a club",
    });
  }
  return configured;
};

/**
 * The public URL for one file id, or null if there is no id or no file row.
 *
 * Its own function because `id ? map.get(id) : null` repeated for two images is
 * what pushes the handler past the complexity budget, and because a null here
 * has a real meaning: the id is unset, or the file it referenced has been
 * deleted. Both render as "no banner" rather than a broken image.
 */
const urlFor = (urls: Map<string, string>, id: string | null) =>
  id ? (urls.get(id) ?? null) : null;

/**
 * The registry row's values, each falling back to the hardcoded constant.
 *
 * The row is a *presentation* record and may not exist yet — it is created
 * lazily, on first credential issuance, or by `applyClub` if a banner was
 * approved before anyone had signed in. So every field has to survive a missing
 * row, and the club still has to be nameable and addressable while that is true.
 *
 * Split out from the handler because six `registry?.x ?? fallback` pairs in one
 * function body is exactly the shape that makes a handler hard to read, and it is
 * also what pushes it past the complexity budget.
 */
const presentationOf = (
  configured: {
    readonly name: string;
    readonly slug: string;
    readonly status: string;
  },
  registry:
    | {
        name: string;
        slug: string;
        status: string;
        description: string | null;
        coverImageId: string | null;
        backgroundImageId: string | null;
      }
    | undefined
) => ({
  name: registry?.name ?? configured.name,
  slug: registry?.slug ?? configured.slug,
  status: registry?.status ?? configured.status,
  description: registry?.description ?? null,
  coverImageId: registry?.coverImageId ?? null,
  backgroundImageId: registry?.backgroundImageId ?? null,
});

export const myClub = protectedProcedure.handler(async ({ context }) => {
  const configured = requireOwnClub(context.session?.user?.username);

  const registry = await context.db
    .select({
      name: club.name,
      slug: club.slug,
      status: club.status,
      description: club.description,
      coverImageId: club.coverImageId,
      backgroundImageId: club.backgroundImageId,
    })
    .from(club)
    .where(eq(club.id, configured.id))
    .get();

  const shown = presentationOf(configured, registry);

  /*
   * The banner is stored as a `fileId` and rendered as a URL, so the portal's
   * cover-image panel can show the club what it currently has. Resolved here
   * rather than in the browser because the extension lives in the storage key:
   * see `./file-urls`.
   */
  const images = await resolveFileUrls(context.db, [
    shown.coverImageId ?? "",
    shown.backgroundImageId ?? "",
  ]);

  return {
    id: configured.id,
    adminUsername: configured.adminUsername,
    ...shown,
    coverImageUrl: urlFor(images, shown.coverImageId),
    backgroundImageUrl: urlFor(images, shown.backgroundImageId),
    /**
     * What this club is charged with beyond its own pages. The portal reads
     * this to decide which link targets to offer - only a club that manages
     * the school's galleries is offered other clubs' records.
     */
    capabilities: configured.capabilities,
  };
});

/**
 * The columns a gallery table's header may order by.
 *
 * Exported because the web layer builds its sortable headers from this list
 * rather than writing its own: a header that offers a column this handler
 * cannot order by is a control that silently does nothing, and the fix for that
 * is not a second list to remember.
 */
export const GALLERY_SORT_KEYS = [
  "title",
  "status",
  "itemCount",
  "publishedAt",
] as const;

/** What a gallery header may ask the handler to order by. */
export type GallerySortKey = (typeof GALLERY_SORT_KEYS)[number];

/** A gallery row as the list reads it, before its relations are attached. */
type GalleryBase = typeof gallery.$inferSelect;

/** One row as the sorters see it: the row, plus what its Images column shows. */
interface SortableGallery {
  row: GalleryBase;
  itemCount: number;
}

/**
 * A gallery that was never published sorts as the epoch rather than as "no
 * value", so it lands where an ascending date column puts it and where a
 * descending one hides it — the same bargain `admin-clubs` makes for activity.
 */
const publishedAtOf = (row: GalleryBase) => row.publishedAt?.getTime() ?? 0;

/** The order the list is in when the URL names no sort: newest first. */
const comparePublishedAt = (a: SortableGallery, b: SortableGallery) =>
  publishedAtOf(a.row) - publishedAtOf(b.row);

/** One comparator per name the gallery headers may send. */
const GALLERY_SORTERS: Record<
  string,
  (a: SortableGallery, b: SortableGallery) => number
> = {
  title: (a, b) => a.row.title.localeCompare(b.row.title),
  status: (a, b) => a.row.status.localeCompare(b.row.status),
  itemCount: (a, b) => a.itemCount - b.itemCount,
  publishedAt: comparePublishedAt,
};

/**
 * Every gallery's items, cover and links, attached in one pass.
 *
 * Everything the gallery screens need in one call, because a club with a dozen
 * galleries would otherwise issue a query per gallery for each of the three
 * things shown per row - and a list that has to finish twelve round trips before
 * it renders anything is a list the administrator learns not to trust.
 *
 * Items arrive in `position` order carrying their image role *and* a resolved
 * `imageUrl`, so the list can show each gallery's cover as a thumbnail and the
 * detail screen can offer "make this the cover" against the actual picture
 * rather than a caption. An empty row set is returned as one rather than
 * issuing an `IN ()` clause over nothing.
 */
const attachGalleryRelations = async (
  db: DbLike,
  rows: readonly GalleryBase[]
) => {
  if (rows.length === 0) {
    return [];
  }

  const galleryIds = rows.map((row) => row.id);

  const [items, links] = await Promise.all([
    withImageUrls(
      db,
      await db
        .select()
        .from(galleryItem)
        .where(inArray(galleryItem.galleryId, galleryIds))
        .orderBy(asc(galleryItem.position), asc(galleryItem.createdAt))
        .all()
    ),
    db
      .select()
      .from(galleryLink)
      .where(inArray(galleryLink.galleryId, galleryIds))
      .all(),
  ]);

  const byGallery = new Map<string, typeof items>();
  for (const item of items) {
    const bucket = byGallery.get(item.galleryId);
    if (bucket) {
      bucket.push(item);
    } else {
      byGallery.set(item.galleryId, [item]);
    }
  }

  /*
   * Target titles resolved for every link across every gallery at once, rather
   * than one lookup per link. A link to a deleted target comes back with a null
   * title rather than being dropped, because the club has to be able to see it
   * in order to clear it - see `submitGalleryLinkDelete`.
   */
  const titles = new Map<string, string | null>();
  const linksByGallery = new Map<string, typeof links>();
  for (const link of links) {
    const bucket = linksByGallery.get(link.galleryId);
    if (bucket) {
      bucket.push(link);
    } else {
      linksByGallery.set(link.galleryId, [link]);
    }
  }

  await Promise.all(
    [...linksByGallery.values()].flat().map(async (link) => {
      titles.set(
        link.id,
        await linkTargetTitle(db, link.target, link.targetId)
      );
    })
  );

  return rows.map((row) => {
    const galleryItems = byGallery.get(row.id) ?? [];
    return {
      ...row,
      items: galleryItems,
      /** The one image that represents the gallery, if it has one. */
      coverItem: galleryItems.find((item) => item.isCover) ?? null,
      links: (linksByGallery.get(row.id) ?? []).map((link) => ({
        id: link.id,
        target: link.target,
        targetId: link.targetId,
        targetTitle: titles.get(link.id) ?? null,
      })),
    };
  });
};

/**
 * The signed-in club's own galleries, as one filtered, sorted, paginated page.
 *
 * Search, sort and paging are the URL's, and the relations are attached to the
 * *page* rather than to every gallery: the counts the sort orders by come from
 * one grouped read, so a club with fifty galleries asks for fifty rows' worth of
 * items rather than all of them. The detail screen reads a gallery of its own
 * through `getMyGallery`, which is why this one is allowed to be a page.
 */
export const listMyGalleries = protectedProcedure
  .input(
    v.intersect([
      listParamsSchema,
      v.object({ status: v.optional(v.picklist(["published", "archived"])) }),
    ])
  )
  .handler(async ({ context, input }) => {
    const configured = requireOwnClub(context.session?.user?.username);

    const [rows, itemCounts] = await Promise.all([
      context.db
        .select()
        .from(gallery)
        .where(
          input.status
            ? and(
                eq(gallery.ownerClubId, configured.id),
                eq(gallery.status, input.status)
              )
            : eq(gallery.ownerClubId, configured.id)
        )
        .all(),
      context.db
        .select({ galleryId: galleryItem.galleryId, items: count() })
        .from(galleryItem)
        .innerJoin(gallery, eq(galleryItem.galleryId, gallery.id))
        .where(eq(gallery.ownerClubId, configured.id))
        .groupBy(galleryItem.galleryId)
        .all(),
    ]);

    /*
     * Indexed rather than looked up per row: the counts are read once and read
     * once per gallery, which is the difference between two reads and a nested
     * loop for the Images column's sort.
     */
    const itemCountByGallery = new Map(
      itemCounts.map((row) => [row.galleryId, Number(row.items) || 0])
    );

    const term = input.q.toLowerCase();
    const matching = rows.filter((row) => {
      if (!term) {
        return true;
      }
      return [row.title, row.summary, row.slug]
        .filter((field): field is string => field !== null)
        .some((field) => field.toLowerCase().includes(term));
    });

    const sign = sortDirectionOf(input, "desc") === "asc" ? 1 : -1;
    const compare = GALLERY_SORTERS[input.sortBy ?? ""] ?? comparePublishedAt;
    const decorated = matching.map((row) => ({
      row,
      itemCount: itemCountByGallery.get(row.id) ?? 0,
    }));
    const sorted = [...decorated].toSorted((a, b) => sign * compare(a, b));

    const total = sorted.length;
    const start = listOffset(input);
    const page = sorted.slice(start, start + input.pageSize);

    return {
      rows: await attachGalleryRelations(
        context.db,
        page.map((entry) => entry.row)
      ),
      total,
    };
  });

/**
 * One gallery, for the gallery's own screen.
 *
 * A read of its own rather than a find over the list above, because the list is
 * a *page*: a gallery on page three of the club's list is not in the page the
 * detail screen would have searched, and "not on this page" must not be
 * renderable as "no such gallery". Ownership is checked in the same statement
 * that reads the row, so another club's id is a 404 and never a hit.
 */
export const getMyGallery = protectedProcedure
  .input(v.object({ galleryId: v.pipe(v.string(), v.minLength(1)) }))
  .handler(async ({ context, input }) => {
    const configured = requireOwnClub(context.session?.user?.username);

    const owned = await context.db
      .select()
      .from(gallery)
      .where(
        and(
          eq(gallery.id, input.galleryId),
          eq(gallery.ownerClubId, configured.id)
        )
      )
      .get();
    if (!owned) {
      throw new ORPCError("NOT_FOUND", { message: "Gallery not found" });
    }

    const [withRelations] = await attachGalleryRelations(context.db, [owned]);
    return withRelations;
  });

/**
 * One gallery's links, with the records they point at named.
 *
 * `gallery_link` is polymorphic with no foreign key, so a row is meaningless on
 * its own - `target: "achievement", targetId: "…"` says nothing a person can
 * read. This resolves each target into a title, which is what the club's own
 * screen has to show: a link the club cannot recognise is a link it will submit
 * a duplicate of.
 *
 * A link whose target has since been deleted is returned with a `null` title
 * rather than dropped, so the club can see it needs clearing. Which targets are
 * resolvable at all is decided in `./link-targets`, shared with the submit
 * handler and the applier so the three lists cannot drift.
 */
export const listMyGalleryLinks = protectedProcedure
  .input(v.object({ galleryId: v.pipe(v.string(), v.minLength(1)) }))
  .handler(async ({ context, input }) => {
    const configured = requireOwnClub(context.session?.user?.username);

    // Ownership first: without it this would read any gallery's links.
    const owned = await context.db
      .select({ id: gallery.id })
      .from(gallery)
      .where(
        and(
          eq(gallery.id, input.galleryId),
          eq(gallery.ownerClubId, configured.id)
        )
      )
      .get();
    if (!owned) {
      throw new ORPCError("NOT_FOUND", { message: "Gallery not found" });
    }

    const links = await context.db
      .select()
      .from(galleryLink)
      .where(eq(galleryLink.galleryId, input.galleryId))
      .all();

    return Promise.all(
      links.map(async (link) => ({
        id: link.id,
        target: link.target,
        targetId: link.targetId,
        targetTitle: await linkTargetTitle(
          context.db,
          link.target,
          link.targetId
        ),
      }))
    );
  });

/**
 * The caller's own club events and achievements, for use as link targets.
 *
 * Without this a club cannot attach a gallery to the event it just created: the
 * public `listClubEvents` only returns events that are both published *and*
 * still upcoming, so a club that submitted an event and is waiting for review
 * had nothing to select, and a club that had already happened had nothing to
 * select either. A link to a pending event has to be submittable, because the
 * link and the event are approved independently and the link may be reviewed
 * first.
 *
 * Scoped to the caller's club on the server, for the same reason every other
 * procedure here is: the club is never named by the client.
 */
export const listMyLinkTargets = protectedProcedure.handler(
  async ({ context }) => {
    const configured = requireOwnClub(context.session?.user?.username);

    const [events, achievements, announcements] = await Promise.all([
      context.db
        .select({
          id: clubEvent.id,
          title: clubEvent.title,
          startsAt: clubEvent.startsAt,
          publishedAt: clubEvent.publishedAt,
        })
        .from(clubEvent)
        .where(eq(clubEvent.clubId, configured.id))
        .orderBy(desc(clubEvent.startsAt))
        .all(),
      context.db
        .select({
          id: clubAchievement.id,
          title: clubAchievement.title,
          achievedOn: clubAchievement.achievedOn,
          publishedAt: clubAchievement.publishedAt,
        })
        .from(clubAchievement)
        .where(eq(clubAchievement.clubId, configured.id))
        .orderBy(desc(clubAchievement.publishedAt))
        .all(),
      context.db
        .select({
          id: clubAnnouncement.id,
          title: clubAnnouncement.title,
          publishedAt: clubAnnouncement.publishedAt,
        })
        .from(clubAnnouncement)
        .where(eq(clubAnnouncement.clubId, configured.id))
        .orderBy(desc(clubAnnouncement.publishedAt))
        .all(),
    ]);

    return { events, achievements, announcements };
  }
);

/**
 * Everything outside the caller's own club that a gallery can link to.
 *
 * `listMyLinkTargets` answers "what of mine is there to attach to"; this
 * answers "what else is there" - school-wide events, achievements and
 * announcements, plus every *other* club's events, achievements and
 * announcements, each row carrying the club's name so a picker can label it.
 *
 * Reading another club's titles is deliberate and is not a leak: a gallery link
 * is a pointer, not a permission, and the photographs of another club's event
 * are exactly what the school's photography club exists to publish. The other
 * club does not approve the link - the CMS does, in the same queue as every
 * other submission. Pending rows are included, because a link may be reviewed
 * before the record it names is.
 *
 * The caller's own club is excluded so the two procedures stay disjoint; the
 * picker offers "yours" from `listMyLinkTargets` and "theirs and the school's"
 * from this, and no record can appear in both.
 */
export const listSchoolLinkTargets = protectedProcedure.handler(
  async ({ context }) => {
    const configured = requireOwnClub(context.session?.user?.username);

    const [
      schoolEvents,
      schoolAchievements,
      schoolAnnouncements,
      clubRows,
      otherClubEvents,
      otherClubAchievements,
      otherClubAnnouncements,
    ] = await Promise.all([
      context.db
        .select({
          id: event.id,
          title: event.title,
          startsAt: event.startsAt,
          publishedAt: event.publishedAt,
        })
        .from(event)
        .orderBy(desc(event.startsAt))
        .all(),
      context.db
        .select({
          id: achievement.id,
          title: achievement.title,
          category: achievement.category,
          publishedAt: achievement.publishedAt,
        })
        .from(achievement)
        .orderBy(desc(achievement.publishedAt))
        .all(),
      context.db
        .select({
          id: announcement.id,
          title: announcement.title,
          publishedAt: announcement.publishedAt,
        })
        .from(announcement)
        .orderBy(desc(announcement.publishedAt))
        .all(),
      context.db.select({ id: club.id, name: club.name }).from(club).all(),
      context.db
        .select({
          id: clubEvent.id,
          title: clubEvent.title,
          clubId: clubEvent.clubId,
          startsAt: clubEvent.startsAt,
          publishedAt: clubEvent.publishedAt,
        })
        .from(clubEvent)
        .where(ne(clubEvent.clubId, configured.id))
        .orderBy(desc(clubEvent.startsAt))
        .all(),
      context.db
        .select({
          id: clubAchievement.id,
          title: clubAchievement.title,
          clubId: clubAchievement.clubId,
          achievedOn: clubAchievement.achievedOn,
          publishedAt: clubAchievement.publishedAt,
        })
        .from(clubAchievement)
        .where(ne(clubAchievement.clubId, configured.id))
        .orderBy(desc(clubAchievement.publishedAt))
        .all(),
      context.db
        .select({
          id: clubAnnouncement.id,
          title: clubAnnouncement.title,
          clubId: clubAnnouncement.clubId,
          publishedAt: clubAnnouncement.publishedAt,
        })
        .from(clubAnnouncement)
        .where(ne(clubAnnouncement.clubId, configured.id))
        .orderBy(desc(clubAnnouncement.publishedAt))
        .all(),
    ]);

    const clubName = new Map(clubRows.map((row) => [row.id, row.name]));

    const label = (clubId: string) => clubName.get(clubId) ?? "Another club";

    return {
      school: {
        events: schoolEvents,
        achievements: schoolAchievements,
        announcements: schoolAnnouncements,
      },
      otherClubs: {
        events: otherClubEvents.map((row) => ({
          ...row,
          clubName: label(row.clubId),
        })),
        achievements: otherClubAchievements.map((row) => ({
          ...row,
          clubName: label(row.clubId),
        })),
        announcements: otherClubAnnouncements.map((row) => ({
          ...row,
          clubName: label(row.clubId),
        })),
      },
    };
  }
);

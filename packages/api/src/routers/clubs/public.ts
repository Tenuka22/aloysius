import type { Database } from "@aloysius/db";
import { announcement } from "@aloysius/db/schema/announcements";
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
  GALLERY_KINDS,
  GALLERY_LINK_TARGETS,
  MAX_TRENDING_GALLERY_ITEMS,
  photoGallery,
} from "@aloysius/db/schema/gallery";
import { achievement, event, person } from "@aloysius/db/schema/root-content";
import {
  and,
  asc,
  desc,
  eq,
  gte,
  inArray,
  isNotNull,
  isNull,
  lte,
  or,
  sql,
} from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import type { AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import * as v from "valibot";

import { publicProcedure } from "../../index";
import { resolveFileUrls, withImageUrls } from "./file-urls";
import { linkTargetTitle } from "./link-targets";

/**
 * Public reads over club-authored content.
 *
 * Every query here requires published state: `status = 'published'` for
 * galleries, a non-null `publishedAt` for events and announcements. That is not
 * a defensive nicety - it is the point of the submission tables. Content no CMS
 * reviewer has approved has no published row to find, so there is no code path
 * in this file that can leak an unapproved draft.
 *
 * Which means a gallery here is open to anyone. There is no per-viewer check on
 * any procedure in this file, and none is wanted: a club's photographs are
 * published to the school and to the world once a reviewer approves them, and the
 * review is the gate.
 */

const MAX_PAGE_SIZE = 100;

const publishedGallery = and(
  eq(gallery.status, "published"),
  isNotNull(gallery.publishedAt)
) as SQL;

/** Resolve a club slug to its id, or null when no such club exists. */
const resolveClubId = async (
  db: Database,
  slug: string
): Promise<string | null> => {
  const row = await db
    .select({ id: club.id })
    .from(club)
    .where(and(eq(club.slug, slug), eq(club.status, "active")))
    .limit(1)
    .get();

  return row?.id ?? null;
};

/**
 * Show a row whose `[effectiveFrom, expiresAt]` window contains `now`. Both
 * ends are optional, so a row with no bounds is always in window.
 */
const withinWindow = (
  effectiveFrom: AnySQLiteColumn,
  expiresAt: AnySQLiteColumn,
  now: Date
) =>
  and(
    or(isNull(effectiveFrom), lte(effectiveFrom, now)),
    or(isNull(expiresAt), gte(expiresAt, now))
  );

const slugInput = v.optional(v.pipe(v.string(), v.minLength(1)));
const limitInput = v.optional(
  v.pipe(v.number(), v.integer(), v.minValue(1), v.maxValue(MAX_PAGE_SIZE))
);

/** Active clubs, alphabetically, with their presentation imagery ids and URLs. */
export const listClubs = publicProcedure.handler(async ({ context }) => {
  const rows = await context.db
    .select({
      id: club.id,
      slug: club.slug,
      name: club.name,
      description: club.description,
      coverImageId: club.coverImageId,
      backgroundImageId: club.backgroundImageId,
    })
    .from(club)
    .where(eq(club.status, "active"))
    .orderBy(asc(club.name))
    .all();

  /*
   * The cover image is the club's banner, and a club's banner is the thing that
   * makes it recognisable on the students page. Resolved to a URL here so a
   * caller that has a club row can render it without knowing how storage keys
   * become addresses.
   */
  const urls = await resolveFileUrls(context.db, [
    ...rows.map((row) => row.coverImageId ?? ""),
    ...rows.map((row) => row.backgroundImageId ?? ""),
  ]);

  return rows.map((row) => ({
    ...row,
    coverImageUrl: row.coverImageId
      ? (urls.get(row.coverImageId) ?? null)
      : null,
    backgroundImageUrl: row.backgroundImageId
      ? (urls.get(row.backgroundImageId) ?? null)
      : null,
  }));
});

/**
 * Published galleries with their items, for the media pages.
 *
 * Optionally narrowed to one club or one kind. Items come back in `position`
 * order with the cover and trending flags intact, so the caller can pick the
 * cover itself rather than trusting a second query to agree.
 */
export const listGalleries = publicProcedure
  .input(
    v.object({
      clubSlug: slugInput,
      kind: v.optional(v.picklist(GALLERY_KINDS)),
      limit: limitInput,
    })
  )
  .handler(async ({ context, input }) => {
    const filters: SQL[] = [publishedGallery];

    if (input.kind) {
      filters.push(eq(gallery.kind, input.kind));
    }
    if (input.clubSlug) {
      const clubId = await resolveClubId(context.db, input.clubSlug);
      if (!clubId) {
        return [];
      }
      filters.push(eq(gallery.ownerClubId, clubId));
    } else {
      const activeClubs = await context.db
        .select({ id: club.id })
        .from(club)
        .where(eq(club.status, "active"))
        .all();
      filters.push(
        (activeClubs.length > 0
          ? or(
              isNull(gallery.ownerClubId),
              inArray(
                gallery.ownerClubId,
                activeClubs.map((activeClub) => activeClub.id)
              )
            )
          : isNull(gallery.ownerClubId)) as SQL
      );
    }

    const galleryRows = await context.db
      .select()
      .from(gallery)
      .where(and(...filters))
      .orderBy(desc(gallery.publishedAt))
      .limit(input.limit ?? 24)
      .all();

    if (galleryRows.length === 0) {
      return [];
    }

    const items = await withImageUrls(
      context.db,
      await context.db
        .select()
        .from(galleryItem)
        .where(
          inArray(
            galleryItem.galleryId,
            galleryRows.map((row) => row.id)
          )
        )
        .orderBy(asc(galleryItem.position), asc(galleryItem.createdAt))
        .all()
    );

    const itemsByGallery = new Map<string, typeof items>();
    for (const item of items) {
      const bucket = itemsByGallery.get(item.galleryId);
      if (bucket) {
        bucket.push(item);
      } else {
        itemsByGallery.set(item.galleryId, [item]);
      }
    }

    return galleryRows.map((row) => ({
      ...row,
      items: itemsByGallery.get(row.id) ?? [],
    }));
  });

/** The published galleries a single club owns, for the featured-media feed. */
const findOwnedGalleries = async (db: Database, clubSlug: string) => {
  const clubId = await resolveClubId(db, clubSlug);
  if (!clubId) {
    return [];
  }

  return db
    .select()
    .from(gallery)
    .where(and(publishedGallery, eq(gallery.ownerClubId, clubId)))
    .all();
};

/**
 * The homepage media feed: one cover per gallery plus a single trending strip.
 *
 * The five-item cap is applied twice on purpose. The database caps trending
 * items per gallery at five; this query additionally caps the union across all
 * of a club's galleries at five, because the homepage shows one strip rather
 * than one per gallery. Both numbers are the same constant.
 */
export const getFeaturedMedia = publicProcedure
  .input(v.object({ clubSlug: slugInput }))
  .handler(async ({ context, input }) => {
    let owned: Awaited<ReturnType<typeof findOwnedGalleries>> = [];
    if (input.clubSlug) {
      owned = await findOwnedGalleries(context.db, input.clubSlug);
    }

    if (owned.length === 0) {
      return { covers: [], trending: [] };
    }

    const items = await withImageUrls(
      context.db,
      await context.db
        .select()
        .from(galleryItem)
        .where(
          inArray(
            galleryItem.galleryId,
            owned.map((row) => row.id)
          )
        )
        .all()
    );

    const titleByGallery = new Map(owned.map((row) => [row.id, row.title]));
    const slugByGallery = new Map(owned.map((row) => [row.id, row.slug]));
    /*
     * The album link travels with each item so the tile that represents a
     * gallery can offer it. A club's best photographs usually live off-site, and
     * this is the only way that is ever visible to a visitor.
     */
    const albumByGallery = new Map(
      owned.map((row) => [row.id, row.albumUrl] as const)
    );

    const withGallery = (item: (typeof items)[number]) => ({
      albumUrl: albumByGallery.get(item.galleryId) ?? null,
      gallerySlug: slugByGallery.get(item.galleryId) ?? "",
      galleryTitle: titleByGallery.get(item.galleryId) ?? "",
      item,
    });

    const coverItems: typeof items = [];
    for (const item of items) {
      if (item.isCover) {
        coverItems.push(item);
      }
    }
    const covers = coverItems.map(withGallery);

    const trending = items
      .filter((item) => item.isTrending)
      // A trending item always has a position (a database check enforces it);
      // the fallback only exists so a corrupt row sorts last instead of NaN.
      .toSorted(
        (a, b) =>
          (a.trendingPosition ?? MAX_TRENDING_GALLERY_ITEMS + 1) -
          (b.trendingPosition ?? MAX_TRENDING_GALLERY_ITEMS + 1)
      )
      .slice(0, MAX_TRENDING_GALLERY_ITEMS)
      .map(withGallery);

    return { covers, trending };
  });

/**
 * The kind-specific detail row, as a flat object.
 *
 * A gallery has at most one of the three detail tables, and which one depends on
 * `kind`. Reading all three and merging is one round trip each and no branch on
 * the caller, so the shape a page consumes is the same for every gallery kind.
 */
const readGalleryDetails = async (
  db: Database,
  galleryId: string,
  kind: string
): Promise<Record<string, unknown>> => {
  if (kind === "photo") {
    return (
      (await db
        .select()
        .from(photoGallery)
        .where(eq(photoGallery.galleryId, galleryId))
        .get()) ?? {}
    );
  }
  if (kind === "art") {
    return (
      (await db
        .select()
        .from(artGallery)
        .where(eq(artGallery.galleryId, galleryId))
        .get()) ?? {}
    );
  }
  return (
    (await db
      .select()
      .from(digitalGallery)
      .where(eq(digitalGallery.galleryId, galleryId))
      .get()) ?? {}
  );
};

/**
 * One published gallery, addressed by slug, open to anyone.
 *
 * This is the "open any gallery" surface: no session, no club scoping, no
 * per-viewer filter - just the published gate. It returns everything a gallery
 * page needs in one call, because a page that issued four requests to render one
 * album would be four chances to show a gallery half-built:
 *
 * - the kind-specific detail row, so a photo gallery can show where and when it
 *   was shot;
 * - the items with resolved image URLs, in position order;
 * - the owning club, so the page can say who to thank;
 * - the off-site album link, which is how a visitor reaches the photographs that
 *   are too many or too large to host here;
 * - the links out to other subjects, with the target titles resolved, so the page
 *   can navigate to them rather than print an id.
 */
export const getGallery = publicProcedure
  .input(v.object({ slug: v.pipe(v.string(), v.minLength(1)) }))
  .handler(async ({ context, input }) => {
    const row = await context.db
      .select({
        id: gallery.id,
        slug: gallery.slug,
        kind: gallery.kind,
        title: gallery.title,
        summary: gallery.summary,
        albumUrl: gallery.albumUrl,
        albumLabel: gallery.albumLabel,
        publishedAt: gallery.publishedAt,
        ownerClubId: gallery.ownerClubId,
        clubName: club.name,
        clubSlug: club.slug,
      })
      .from(gallery)
      .leftJoin(club, eq(club.id, gallery.ownerClubId))
      .where(and(publishedGallery, eq(gallery.slug, input.slug)))
      .get();

    if (!row) {
      return null;
    }

    const [items, details, links] = await Promise.all([
      withImageUrls(
        context.db,
        await context.db
          .select()
          .from(galleryItem)
          .where(eq(galleryItem.galleryId, row.id))
          .orderBy(asc(galleryItem.position), asc(galleryItem.createdAt))
          .all()
      ),
      readGalleryDetails(context.db, row.id, row.kind),
      context.db
        .select()
        .from(galleryLink)
        .where(eq(galleryLink.galleryId, row.id))
        .all(),
    ]);

    return {
      ...row,
      items,
      details,
      links: await Promise.all(
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
      ),
    };
  });

/**
 * The published galleries linked to one subject.
 *
 * This is the query that makes an event's photographs findable from the event.
 * An event holds no images of its own - by design, since an event's cover is a
 * single image and everything else about it is a gallery someone else curates -
 * so the event page has to ask this to know there is anything to show.
 *
 * Archived galleries are excluded even though a link to them may survive: a
 * withdrawn album should stop appearing, and the link row is kept so it can be
 * cleared rather than silently orphaned.
 */
export const listGalleriesForTarget = publicProcedure
  .input(
    v.object({
      target: v.picklist(GALLERY_LINK_TARGETS),
      targetId: v.pipe(v.string(), v.minLength(1)),
    })
  )
  .handler(async ({ context, input }) => {
    const linked = await context.db
      .select({ galleryId: galleryLink.galleryId })
      .from(galleryLink)
      .where(
        and(
          eq(galleryLink.target, input.target),
          eq(galleryLink.targetId, input.targetId)
        )
      )
      .all();

    if (linked.length === 0) {
      return [];
    }

    const rows = await context.db
      .select({
        id: gallery.id,
        slug: gallery.slug,
        kind: gallery.kind,
        title: gallery.title,
        summary: gallery.summary,
        albumUrl: gallery.albumUrl,
        albumLabel: gallery.albumLabel,
        publishedAt: gallery.publishedAt,
      })
      .from(gallery)
      .where(
        and(
          publishedGallery,
          inArray(
            gallery.id,
            linked.map((row) => row.galleryId)
          )
        )
      )
      .orderBy(desc(gallery.publishedAt))
      .all();

    if (rows.length === 0) {
      return [];
    }

    const items = await withImageUrls(
      context.db,
      await context.db
        .select()
        .from(galleryItem)
        .where(
          inArray(
            galleryItem.galleryId,
            rows.map((row) => row.id)
          )
        )
        .orderBy(asc(galleryItem.position), asc(galleryItem.createdAt))
        .all()
    );

    const byGallery = new Map<string, typeof items>();
    for (const item of items) {
      const bucket = byGallery.get(item.galleryId);
      if (bucket) {
        bucket.push(item);
      } else {
        byGallery.set(item.galleryId, [item]);
      }
    }

    return rows.map((row) => ({
      ...row,
      cover: items.find((item) => item.galleryId === row.id && item.isCover),
      itemCount: byGallery.get(row.id)?.length ?? 0,
    }));
  });

/**
 * The galleries linked to each of these events, plus its cover image URL.
 *
 * An event stores no images of its own beyond one cover, so "show me this event"
 * means finding the galleries attached to it. One query across all the events
 * rather than one per event: a page listing twenty events would otherwise issue
 * twenty round trips before it had rendered anything.
 */
const attachEventGalleries = async <T extends { id: string }>(
  db: Database,
  rows: readonly T[]
) => {
  const links = await db
    .select({
      eventId: galleryLink.targetId,
      galleryId: gallery.id,
      gallerySlug: gallery.slug,
      galleryTitle: gallery.title,
      albumUrl: gallery.albumUrl,
      albumLabel: gallery.albumLabel,
    })
    .from(galleryLink)
    .innerJoin(gallery, eq(gallery.id, galleryLink.galleryId))
    .where(
      and(
        eq(galleryLink.target, "clubEvent"),
        inArray(
          galleryLink.targetId,
          rows.map((row) => row.id)
        ),
        publishedGallery
      )
    )
    .all();

  const galleriesByEvent = new Map<string, typeof links>();
  for (const link of links) {
    const bucket = galleriesByEvent.get(link.eventId);
    if (bucket) {
      bucket.push(link);
    } else {
      galleriesByEvent.set(link.eventId, [link]);
    }
  }

  const coverUrls = await resolveFileUrls(
    db,
    rows.map((row) =>
      "coverImageId" in row ? String(row.coverImageId ?? "") : ""
    )
  );

  return rows.map((row) => {
    const { coverImageId } = row as { coverImageId?: string | null };
    return {
      ...row,
      coverImageUrl: coverImageId
        ? (coverUrls.get(coverImageId) ?? null)
        : null,
      galleries: galleriesByEvent.get(row.id) ?? [],
    };
  });
};

/** Published club events, soonest first, optionally for one club. */
export const listClubEvents = publicProcedure
  .input(
    v.object({
      clubSlug: slugInput,
      /** Only events starting at or after this instant. Defaults to now. */
      from: v.optional(v.date()),
      limit: limitInput,
    })
  )
  .handler(async ({ context, input }) => {
    const filters: SQL[] = [
      isNotNull(clubEvent.publishedAt),
      eq(club.status, "active"),
    ];

    if (input.clubSlug) {
      const clubId = await resolveClubId(context.db, input.clubSlug);
      if (!clubId) {
        return [];
      }
      filters.push(eq(clubEvent.clubId, clubId));
    }

    /*
     * `from` is opt-in rather than defaulted to now, because the same list has to
     * answer two different questions: "what is coming up" wants the default, and
     * "what did this club do" - which is what a club event page is - wants the
     * past. Filtering in SQL rather than in the caller so the limit is applied
     * after the filter, not before it.
     */
    if (input.from) {
      filters.push(gte(clubEvent.startsAt, input.from));
    }

    const rows = await context.db
      .select({
        id: clubEvent.id,
        clubId: clubEvent.clubId,
        slug: clubEvent.slug,
        title: clubEvent.title,
        description: clubEvent.description,
        location: clubEvent.location,
        startsAt: clubEvent.startsAt,
        endsAt: clubEvent.endsAt,
        coverImageId: clubEvent.coverImageId,
        publishedAt: clubEvent.publishedAt,
        clubName: club.name,
        clubSlug: club.slug,
      })
      .from(clubEvent)
      .innerJoin(club, eq(club.id, clubEvent.clubId))
      .where(and(...filters))
      .orderBy(asc(clubEvent.startsAt))
      .limit(input.limit ?? 20)
      .all();

    if (rows.length === 0) {
      return [];
    }

    return attachEventGalleries(context.db, rows);
  });

/**
 * Published club achievements, newest first, optionally for one club.
 *
 * The club-scoped counterpart to `listAchievements`, and it exists for the same
 * reason `listClubEvents` does: a club's own results are distinct records from
 * the school's, and a gallery links to either.
 */
export const listClubAchievements = publicProcedure
  .input(v.object({ clubSlug: slugInput, limit: limitInput }))
  .handler(async ({ context, input }) => {
    const filters: SQL[] = [
      isNotNull(clubAchievement.publishedAt),
      eq(club.status, "active"),
    ];

    if (input.clubSlug) {
      const clubId = await resolveClubId(context.db, input.clubSlug);
      if (!clubId) {
        return [];
      }
      filters.push(eq(clubAchievement.clubId, clubId));
    }

    return context.db
      .select({
        id: clubAchievement.id,
        clubId: clubAchievement.clubId,
        title: clubAchievement.title,
        detail: clubAchievement.detail,
        category: clubAchievement.category,
        achievedOn: clubAchievement.achievedOn,
        imageId: clubAchievement.imageId,
        publishedAt: clubAchievement.publishedAt,
        clubName: club.name,
        clubSlug: club.slug,
      })
      .from(clubAchievement)
      .innerJoin(club, eq(club.id, clubAchievement.clubId))
      .where(and(...filters))
      .orderBy(desc(clubAchievement.publishedAt))
      .limit(input.limit ?? 20)
      .all();
  });

/** Root-level published events. Clubs may author these, but they are global. */
export const listEvents = publicProcedure
  .input(v.object({ from: v.optional(v.date()), limit: limitInput }))
  .handler(({ context, input }) =>
    context.db
      .select()
      .from(event)
      .where(
        and(
          isNotNull(event.publishedAt),
          gte(event.startsAt, input.from ?? new Date())
        )
      )
      .orderBy(asc(event.startsAt))
      .limit(input.limit ?? 20)
      .all()
  );

/** Published root-level people and achievements. */
export const listPeople = publicProcedure.handler(({ context }) =>
  context.db
    .select()
    .from(person)
    .where(isNotNull(person.publishedAt))
    .orderBy(asc(person.name))
    .all()
);

export const listAchievements = publicProcedure
  .input(v.object({ limit: limitInput }))
  .handler(({ context, input }) =>
    context.db
      .select()
      .from(achievement)
      .where(isNotNull(achievement.publishedAt))
      .orderBy(desc(achievement.publishedAt))
      .limit(input.limit ?? 12)
      .all()
  );

export interface AnnouncementFeedRow {
  id: string;
  clubId: string | null;
  clubName: string | null;
  title: string;
  body: string;
  audience: unknown;
  severity: unknown;
  isPinned: unknown;
  imageId: string | null;
  linkedAnnouncementId: string | null;
  publishedAt: Date | null;
  scope: "global" | "club";
}

/**
 * The announcement feed: school-wide announcements plus every club
 * announcement, each tagged with its scope so the UI can label it.
 *
 * A club announcement that links to a global announcement appears as its own
 * entry with `linkedAnnouncementId` set. The two are separate editorial
 * statements - the club's own wording plus a reference to the school's - so
 * collapsing them would hide which words the club chose.
 */
export const listAnnouncements = publicProcedure
  .input(v.object({ limit: limitInput }))
  .handler(async ({ context, input }) => {
    const now = new Date();
    const limit = input.limit ?? 20;

    const globalRows = await context.db
      .select({
        id: announcement.id,
        clubId: sql.raw("null"),
        clubName: sql.raw("null"),
        title: announcement.title,
        body: announcement.body,
        audience: announcement.audience,
        severity: announcement.severity,
        isPinned: announcement.isPinned,
        imageId: announcement.imageId,
        linkedAnnouncementId: sql.raw("null"),
        publishedAt: announcement.publishedAt,
      })
      .from(announcement)
      .where(
        and(
          isNotNull(announcement.publishedAt),
          withinWindow(announcement.effectiveFrom, announcement.expiresAt, now)
        )
      )
      .orderBy(desc(announcement.publishedAt))
      .limit(limit)
      .all();

    // oxlint-disable-next-line react-doctor/server-sequential-independent-await
    const clubRows = await context.db
      .select({
        id: clubAnnouncement.id,
        clubId: clubAnnouncement.clubId,
        clubName: club.name,
        title: clubAnnouncement.title,
        body: clubAnnouncement.body,
        audience: sql.raw("null"),
        severity: sql.raw("null"),
        isPinned: sql.raw("null"),
        imageId: clubAnnouncement.imageId,
        linkedAnnouncementId: clubAnnouncement.globalAnnouncementId,
        publishedAt: clubAnnouncement.publishedAt,
      })
      .from(clubAnnouncement)
      .innerJoin(club, eq(club.id, clubAnnouncement.clubId))
      .where(
        and(
          eq(club.status, "active"),
          isNotNull(clubAnnouncement.publishedAt),
          withinWindow(
            clubAnnouncement.effectiveFrom,
            clubAnnouncement.expiresAt,
            now
          )
        )
      )
      .orderBy(desc(clubAnnouncement.publishedAt))
      .limit(limit)
      .all();

    const rows: AnnouncementFeedRow[] = [
      ...globalRows.map((row) => ({
        ...row,
        clubId: null,
        clubName: null,
        linkedAnnouncementId: null,
        scope: "global" as const,
      })),
      ...clubRows.map((row) => ({ ...row, scope: "club" as const })),
    ];

    return rows
      .toSorted((a, b) => {
        // Pinned school-wide notices lead, then newest first.
        const pinned =
          Number(b.isPinned ?? false) - Number(a.isPinned ?? false);
        if (pinned !== 0) {
          return pinned;
        }
        return (
          (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0)
        );
      })
      .slice(0, limit);
  });

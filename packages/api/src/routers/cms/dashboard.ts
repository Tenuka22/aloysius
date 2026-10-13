import { announcement } from "@aloysius/db/schema/announcements";
import { gallery } from "@aloysius/db/schema/club-photos";
import { club } from "@aloysius/db/schema/clubs";
import { contentVersion } from "@aloysius/db/schema/cms";
import { newsPost } from "@aloysius/db/schema/news-posts";
import { achievement, event } from "@aloysius/db/schema/root-content";
import { and, count, desc, eq, isNull, sql } from "drizzle-orm";

import { cmsProcedure } from "../../index";

/**
 * What the CMS dashboard shows.
 *
 * Every number here is a `count()` against the table it describes. The screen
 * used to render three fixed tiles - "News posts 24", "Media items 112",
 * "Pending 3" - plus three invented pending items with invented titles, none of
 * which were read from the database. A dashboard whose numbers cannot be wrong
 * is worse than no dashboard: it tells an editor the college has published
 * twenty-four stories when it has published three.
 *
 * What it deliberately does **not** claim:
 *
 * - **Broken links.** There is no link checker in this project, so "None found"
 *   would assert the result of a scan that never ran. Reported as not
 *   configured instead.
 * - **Last backup.** Backup is a deployment concern - the compose stack and the
 *   migration job - not a row in this database.
 */

/** The pages that have a CMS editor, in nav order. */
const CMS_PAGES = [
  "homepage",
  "principal",
  "about",
  "news",
  "notices",
  "contact",
  "alumni",
  "media",
  "students",
] as const;

export const dashboardStats = cmsProcedure.handler(async ({ context }) => {
  const { db } = context;

  const [
    newsPosts,
    achievements,
    clubs,
    approvedGalleries,
    pendingGalleries,
    pendingEvents,
    pendingAnnouncements,
    pendingNews,
    upcomingEvents,
    publishedPages,
    draftPages,
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(newsPost)
      .where(eq(newsPost.status, "approved"))
      .get()
      .then((r) => r?.value ?? 0),
    db
      .select({ value: count() })
      .from(achievement)
      .get()
      .then((r) => r?.value ?? 0),
    db
      .select({ value: count() })
      .from(club)
      .get()
      .then((r) => r?.value ?? 0),
    db
      .select({ value: count() })
      .from(gallery)
      .where(eq(gallery.status, "approved"))
      .get()
      .then((r) => r?.value ?? 0),
    db
      .select({ value: count() })
      .from(gallery)
      .where(eq(gallery.status, "pending"))
      .get()
      .then((r) => r?.value ?? 0),
    db
      .select({ value: count() })
      .from(event)
      .where(eq(event.status, "pending"))
      .get()
      .then((r) => r?.value ?? 0),
    db
      .select({ value: count() })
      .from(announcement)
      .where(eq(announcement.status, "pending"))
      .get()
      .then((r) => r?.value ?? 0),
    db
      .select({ value: count() })
      .from(newsPost)
      .where(eq(newsPost.status, "pending"))
      .get()
      .then((r) => r?.value ?? 0),
    db
      .select({ value: count() })
      .from(event)
      .where(
        sql`${event.status} = 'approved' and ${event.startsAt} >= unixepoch() * 1000`
      )
      .get()
      .then((r) => r?.value ?? 0),
    /*
     * A page counts as published when at least one of its block rows is flagged
     * published, so this counts distinct page names rather than block rows -
     * eleven published homepage blocks must read as one published page.
     */
    db
      .select({ page: contentVersion.page })
      .from(contentVersion)
      .where(eq(contentVersion.published, true))
      .groupBy(contentVersion.page)
      .all()
      .then((rows) => rows.length),
    /*
     * A page has an unpublished draft when some block of it is saved but not
     * published - `isNull(batchId)` is the draft marker `saveDraftBlocks` uses.
     */
    db
      .select({ page: contentVersion.page })
      .from(contentVersion)
      .where(
        and(eq(contentVersion.published, false), isNull(contentVersion.batchId))
      )
      .groupBy(contentVersion.page)
      .all()
      .then((rows) => rows.length),
  ]);

  const pending =
    pendingGalleries + pendingEvents + pendingAnnouncements + pendingNews;

  /*
   * The review queue, newest first. Only rows a reviewer can actually act on -
   * `status = 'pending'`, the same gate the galleries screen reviews against.
   */
  const queueSources = await Promise.all([
    db
      .select({
        id: gallery.id,
        title: gallery.title,
        createdAt: gallery.createdAt,
        type: sql<"Gallery">`'Gallery'`,
      })
      .from(gallery)
      .where(eq(gallery.status, "pending"))
      .orderBy(desc(gallery.createdAt))
      .limit(6)
      .all(),
    db
      .select({
        id: event.id,
        title: event.title,
        createdAt: event.createdAt,
        type: sql<"Event">`'Event'`,
      })
      .from(event)
      .where(eq(event.status, "pending"))
      .orderBy(desc(event.createdAt))
      .limit(6)
      .all(),
  ]);

  const queue = queueSources
    .flat()
    .toSorted((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 6)
    .map((row) => ({ id: row.id, type: row.type, title: row.title }));

  return {
    tiles: [
      {
        id: "pages",
        label: "Published pages",
        value: String(publishedPages),
        sub: `of ${CMS_PAGES.length} with an editor`,
        tone: "green" as const,
      },
      {
        id: "news",
        label: "News posts",
        value: String(newsPosts),
        sub: "Approved and live",
        tone: "gold" as const,
      },
      {
        id: "media",
        label: "Media items",
        value: String(approvedGalleries),
        sub: `${clubs} ${clubs === 1 ? "club" : "clubs"} registered`,
        tone: "green" as const,
      },
      {
        id: "pending",
        label: "Awaiting review",
        value: String(pending),
        sub: pending === 1 ? "1 item" : `${pending} items`,
        tone: pending > 0 ? ("crimson" as const) : ("green" as const),
      },
    ],
    pendingItems: queue,
    health: [
      {
        id: "drafts",
        label: "Pages with unpublished drafts",
        status: draftPages === 0 ? "None" : String(draftPages),
        tone: draftPages === 0 ? ("ok" as const) : ("warn" as const),
      },
      {
        id: "queue",
        label: "Review queue",
        status: pending === 0 ? "Empty" : String(pending),
        tone: pending === 0 ? ("ok" as const) : ("warn" as const),
      },
      {
        id: "upcoming",
        label: "Upcoming events",
        status: String(upcomingEvents),
        tone: upcomingEvents > 0 ? ("ok" as const) : ("muted" as const),
      },
      {
        id: "achievements",
        label: "Achievements recorded",
        status: String(achievements),
        tone: achievements > 0 ? ("ok" as const) : ("muted" as const),
      },
      {
        id: "checks",
        label: "Link & backup checks",
        status: "Not configured",
        tone: "muted" as const,
      },
    ],
  };
});

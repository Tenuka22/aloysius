import { clubAchievement, clubEvent } from "@aloysius/db/schema/clubContent";
import { club } from "@aloysius/db/schema/clubs";
import { gallery, galleryItem, galleryLink } from "@aloysius/db/schema/gallery";
import { ORPCError } from "@orpc/server";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import * as v from "valibot";

import { protectedProcedure } from "../../index";
import { findClubByAdminUsername } from "./config";
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
  };
});

/**
 * The signed-in club's own galleries, with their items and their relations.
 *
 * Everything the gallery screens need in one call, because a club with a dozen
 * galleries would otherwise issue a query per gallery for each of the three
 * things shown per row - and a list that has to finish twelve round trips before
 * it renders anything is a list the administrator learns not to trust.
 *
 * Items arrive in `position` order carrying their image role *and* a resolved
 * `imageUrl`, so the list can show each gallery's cover as a thumbnail and the
 * detail screen can offer "make this the cover" against the actual picture
 * rather than a caption.
 */
export const listMyGalleries = protectedProcedure
  .input(
    v.optional(
      v.object({ status: v.optional(v.picklist(["published", "archived"])) })
    )
  )
  .handler(async ({ context, input }) => {
    const configured = requireOwnClub(context.session?.user?.username);

    const status = input?.status;
    const rows = await context.db
      .select()
      .from(gallery)
      .where(
        status
          ? and(
              eq(gallery.ownerClubId, configured.id),
              eq(gallery.status, status)
            )
          : eq(gallery.ownerClubId, configured.id)
      )
      .orderBy(desc(gallery.publishedAt))
      .all();

    if (rows.length === 0) {
      return [];
    }

    const galleryIds = rows.map((row) => row.id);

    const [items, links] = await Promise.all([
      withImageUrls(
        context.db,
        await context.db
          .select()
          .from(galleryItem)
          .where(inArray(galleryItem.galleryId, galleryIds))
          .orderBy(asc(galleryItem.position), asc(galleryItem.createdAt))
          .all()
      ),
      context.db
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
    await Promise.all(
      links.map(async (link) => {
        titles.set(
          link.id,
          await linkTargetTitle(context.db, link.target, link.targetId)
        );
      })
    );

    const linksByGallery = new Map<string, typeof links>();
    for (const link of links) {
      const bucket = linksByGallery.get(link.galleryId);
      if (bucket) {
        bucket.push(link);
      } else {
        linksByGallery.set(link.galleryId, [link]);
      }
    }

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

    const [events, achievements] = await Promise.all([
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
    ]);

    return { events, achievements };
  }
);

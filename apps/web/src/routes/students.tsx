import type { ImageSource } from "@aloysius/ui/components/primitives/media";
import { StudentsPage } from "@aloysius/ui/components/students/students-page";
import type { StudentEvent } from "@aloysius/ui/components/students/students-page";
import { blocksToStudentsProps } from "@aloysius/ui/content/cms-to-pages";
import type { GalleryItem } from "@aloysius/ui/content/home";
import type { Club, SportTile } from "@aloysius/ui/content/students";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { pageHead } from "@/lib/seo";
import { orpc } from "@/utils/orpc";

/**
 * `/students` - Student Life.
 *
 * `clubs` is the CMS-managed club registry (`cms.listPublishedClubs`), not
 * the old static list - a club created, renamed or removed in `/cms/clubs`
 * shows up here on the next load. Its approved photographs and upcoming
 * events are still live data, folded into this page's gallery strip and
 * events list. Achievements (`cms.listAchievements`) are CMS-direct,
 * school-wide content with no club of their own.
 */

const CLUB = "photography" as const;

const StudentsContent = () => {
  const studentsQuery = orpc.cms.getStudents.queryOptions();
  const { data: students } = useSuspenseQuery(studentsQuery);
  const { data: galleries } = useSuspenseQuery(
    orpc.club.listApprovedGalleries.queryOptions({ input: { club: CLUB } })
  );
  const { data: events } = useSuspenseQuery(orpc.cms.listEvents.queryOptions());
  const { data: achievements } = useSuspenseQuery(
    orpc.cms.listAchievements.queryOptions()
  );
  const { data: clubs } = useSuspenseQuery(
    orpc.cms.listPublishedClubs.queryOptions()
  );
  const { data: sportTileRows } = useSuspenseQuery(
    orpc.cms.listSportTiles.queryOptions()
  );
  const { data: session } = authClient.useSession();

  /*
   * Always call the mapper, passing an empty array when nothing is published.
   * The old `students?.blocks ? ... : {}` skipped it entirely and handed the
   * page an empty object, so the page's own static content (the clubs heading
   * and intro) was never consulted and it rendered a bare "content will be
   * displayed here once published" line instead. The mapper is what falls back
   * to `content/students.ts`; not calling it is what produced the placeholder.
   */
  const cmsProps = blocksToStudentsProps(students?.blocks ?? []);

  /*
   * The mosaic's hero ("feature") tile is always whichever published sport
   * sorts first; every other tile gets the smaller "third" footprint - a
   * position-derived rule, not a CMS field, so an editor never has to pick a
   * layout. See `SportTile` and `SportsGrid`'s `SPAN_STYLES`.
   */
  const sportTiles: SportTile[] = sportTileRows.map((row, index) => ({
    id: row.id,
    name: row.name,
    placeholder: `${row.name} photograph`,
    span: index === 0 ? "feature" : "third",
  }));
  const sportImages: Record<string, ImageSource> = {};
  for (const row of sportTileRows) {
    if (row.imageUrl) {
      sportImages[row.id] = {
        src: row.imageUrl,
        alt: `${row.name} photograph`,
      };
    }
  }

  const galleryItems: GalleryItem[] = galleries.flatMap((gallery) =>
    gallery.photos.map((photo) => ({
      id: photo.id,
      image: photo.imageUrl
        ? { src: photo.imageUrl, alt: photo.altText }
        : undefined,
      label: photo.altText || photo.caption,
      preferredRatio: 1.5,
    }))
  );

  // Read once per mount, not on every render - a `useState` lazy
  // initializer is the one place calling `Date.now()` is safe.
  const [now, setNow] = useState(() => Date.now());
  void setNow;
  const studentEvents: StudentEvent[] = [];
  for (const event of events) {
    if (new Date(event.startsAt).getTime() < now) {
      continue;
    }
    studentEvents.push({
      id: event.id,
      location: event.location,
      startsAt: event.startsAt,
      title: event.title,
    });
  }

  const extraNavItems = (() => {
    if (!session?.user) {
      return [];
    }
    const items = [];
    const { role } = session.user;
    if (role === "admin" || role === "cms") {
      items.push({ id: "cms", label: "CMS", href: "/cms" });
    }
    if (role === "admin") {
      items.push({ id: "admin", label: "Admin", href: "/admin" });
    }
    return items;
  })();

  return (
    <StudentsPage
      /*
       * `eyebrow` and `heroImage` are the only two fields the mapper resolves
       * that this page does not take. The About-shaped hero carries a
       * breadcrumb where an eyebrow would sit and a crest watermark where a
       * photograph would, so both are dropped here rather than spread through
       * as props nothing renders.
       */
      heading={cmsProps.heading}
      tagline={cmsProps.tagline}
      activitiesEyebrow={cmsProps.activitiesEyebrow}
      activitiesHeading={cmsProps.activitiesHeading}
      activitiesIntro={cmsProps.activitiesIntro}
      housesEyebrow={cmsProps.housesEyebrow}
      housesHeading={cmsProps.housesHeading}
      housesIntro={cmsProps.housesIntro}
      houseNames={cmsProps.houseNames}
      prefectsBody={cmsProps.prefectsBody}
      prefectsHeading={cmsProps.prefectsHeading}
      prefectsImage={cmsProps.prefectsImage}
      sportImages={sportImages}
      tiles={sportTiles}
      sportsEyebrow={cmsProps.sportsEyebrow}
      sportsHeading={cmsProps.sportsHeading}
      moreSports={cmsProps.moreSports}
      achievements={achievements.map((achievement) => ({
        id: achievement.id,
        category: achievement.category,
        title: achievement.title,
        detail: achievement.detail ?? "",
      }))}
      clubs={clubs.map((row): Club => ({
        id: row.id,
        name: row.name,
        description: row.description ?? undefined,
        href: row.slug === "photography" ? "/galleries" : undefined,
      }))}
      events={studentEvents}
      extraNavItems={extraNavItems}
      galleryItems={galleryItems}
    />
  );
};

export const Route = createFileRoute("/students")({
  head: () =>
    pageHead({
      description:
        "Discover the vibrant community, clubs and activities that make St. Aloysius' College a place to grow.",
      path: "/students",
      title: "Student Life | St. Aloysius' College, Galle",
    }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <StudentsContent />
    </Suspense>
  ),
});

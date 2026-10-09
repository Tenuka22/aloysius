import type {
  ClubPageAchievement,
  ClubPageAnnouncement,
  ClubPageEvent,
  ClubPageGallery,
} from "@aloysius/ui/components/pages/club-page";
import { ClubPage } from "@aloysius/ui/components/pages/club-page";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

/**
 * `/photography-club` - the Photography Club's own page.
 *
 * A *static* route, hand-typed into the file tree, for the same reason the
 * admin side is: a club's page exists because someone wrote it, not because a
 * URL parameter was guessed. The content is live approved data - galleries,
 * events and announcements all come from the club router's `listApproved*`
 * procedures, which only ever return rows a CMS reviewer has approved, so the
 * page cannot preview work still in the queue.
 *
 * There is no `achievement` concept left in the flat model. There *is* a real
 * `gallery` entity, though, and a club can have any number of approved ones -
 * each gets its own card here, linking to its own `/galleries/<slug>`
 * address, rather than the old single synthetic card that aggregated every
 * approved photo into one fake gallery.
 */

const CLUB = "photography" as const;
const CLUB_NAME = "Photography Club" as const;

const NO_ACHIEVEMENTS: readonly ClubPageAchievement[] = [];

const PhotographyClubContent = () => {
  const { data: galleries } = useSuspenseQuery(
    orpc.club.listApprovedGalleries.queryOptions({ input: { club: CLUB } })
  );
  const { data: events } = useSuspenseQuery(orpc.cms.listEvents.queryOptions());
  const { data: announcements } = useSuspenseQuery(
    orpc.cms.listAnnouncements.queryOptions()
  );
  const { data: session } = authClient.useSession();

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

  const pageGalleries: ClubPageGallery[] = galleries.map((gallery) => ({
    albumLabel: gallery.albumUrl ? "View the full album" : null,
    albumUrl: gallery.albumUrl,
    coverImageUrl: gallery.coverImageUrl ?? gallery.photos[0]?.imageUrl ?? null,
    id: gallery.id,
    slug: gallery.slug,
    summary: gallery.description,
    title: gallery.title,
  }));

  const coverImageUrl =
    galleries.find(
      (gallery) => gallery.coverImageUrl || gallery.photos.length > 0
    )?.coverImageUrl ??
    galleries.find((gallery) => gallery.photos.length > 0)?.photos[0]
      ?.imageUrl ??
    null;

  // Read once per mount, not on every render - a `useState` lazy
  // initializer is the one place calling `Date.now()` is safe.
  const [now, setNow] = useState(() => Date.now());
  void setNow;
  const pageEvents: ClubPageEvent[] = [];
  for (const event of events) {
    if (new Date(event.startsAt).getTime() < now) {
      continue;
    }
    pageEvents.push({
      coverImageUrl: event.coverImageUrl,
      description: event.description,
      endsAt: event.endsAt,
      id: event.id,
      location: event.location,
      startsAt: event.startsAt,
      title: event.title,
    });
  }

  const pageAnnouncements: ClubPageAnnouncement[] = announcements.map(
    (announcement) => ({
      body: announcement.body,
      id: announcement.id,
      imageUrl: announcement.imageUrl,
      publishedAt: announcement.publishedAt,
      title: announcement.title,
    })
  );

  return (
    <ClubPage
      achievements={NO_ACHIEVEMENTS}
      activeHref="/photography-club"
      announcements={pageAnnouncements}
      backgroundImageUrl={null}
      coverImageUrl={coverImageUrl}
      description="The college's photographers, curating and submitting the school's photographs for the public gallery."
      events={pageEvents}
      extraNavItems={extraNavItems}
      eyebrow="Clubs & Societies"
      galleries={pageGalleries}
      name={CLUB_NAME}
    />
  );
};

export const Route = createFileRoute("/photography-club")({
  head: () => ({
    meta: [
      { title: "Photography Club | St. Aloysius' College, Galle" },
      {
        name: "description",
        content:
          "The Photography Club's galleries, events and announcements at St. Aloysius' College, Galle.",
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <PhotographyClubContent />
    </Suspense>
  ),
});

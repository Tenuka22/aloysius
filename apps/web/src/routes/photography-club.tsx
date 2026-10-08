import type {
  ClubPageAchievement,
  ClubPageAnnouncement,
  ClubPageEvent,
  ClubPageGallery,
} from "@aloysius/ui/components/pages/club-page";
import { ClubPage } from "@aloysius/ui/components/pages/club-page";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

/**
 * `/photography-club` - the Photography Club's own page.
 *
 * A *static* route, hand-typed into the file tree, for the same reason the
 * admin side is: a club's page exists because someone wrote it, not because a
 * URL parameter was guessed. The content is live approved data - photos,
 * events and announcements all come from the flat club router's
 * `listApproved*` procedures, which only ever return rows a CMS reviewer has
 * approved, so the page cannot preview work still in the queue.
 *
 * There is no `achievement` concept left in the flat model and no separate
 * `gallery` entity either - a club has exactly one gallery, its own stream of
 * approved photos, so this page links to it as a single card pointing at
 * `/galleries/photography` rather than listing several.
 */

const CLUB = "photography" as const;
const CLUB_NAME = "Photography Club" as const;

const NO_ACHIEVEMENTS: readonly ClubPageAchievement[] = [];

const PhotographyClubContent = () => {
  const { data: photos } = useSuspenseQuery(
    orpc.club.listApprovedPhotos.queryOptions({ input: { club: CLUB } })
  );
  const { data: events } = useSuspenseQuery(
    orpc.club.listApprovedEvents.queryOptions({ input: { club: CLUB } })
  );
  const { data: announcements } = useSuspenseQuery(
    orpc.club.listApprovedAnnouncements.queryOptions({ input: { club: CLUB } })
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

  const albumUrl = photos.find((photo) => photo.albumUrl)?.albumUrl ?? null;
  const galleries: ClubPageGallery[] =
    photos.length === 0
      ? []
      : [
          {
            albumLabel: albumUrl ? "View the full album" : null,
            albumUrl,
            id: CLUB,
            slug: CLUB,
            summary: `${photos.length} approved photograph${photos.length === 1 ? "" : "s"}.`,
            title: `${CLUB_NAME} Gallery`,
          },
        ];

  const pageEvents: ClubPageEvent[] = events.map((event) => ({
    coverImageUrl: event.coverImageUrl,
    description: event.description,
    endsAt: event.endsAt,
    id: event.id,
    location: event.location,
    startsAt: event.startsAt,
    title: event.title,
  }));

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
      coverImageUrl={photos[0]?.imageUrl ?? null}
      description="The college's photographers, curating and submitting the school's photographs for the public gallery."
      events={pageEvents}
      extraNavItems={extraNavItems}
      eyebrow="Clubs & Societies"
      galleries={galleries}
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

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
 * URL parameter was guessed. The content is live approved data - galleries,
 * events, achievements and announcements all come from `getClubPage`, which
 * only ever returns rows a CMS reviewer has approved, so the page cannot
 * preview work still in the queue.
 *
 * This is the school's photography club, so the galleries lead: it curates
 * the school's photographs wherever they were taken, and each gallery carries
 * its own off-site album link where the full set lives elsewhere.
 */

const CLUB_SLUG = "photography";

const PhotographyClubContent = () => {
  const { data: page } = useSuspenseQuery(
    orpc.clubs.getClubPage.queryOptions({ input: { slug: CLUB_SLUG } })
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
    if (role === "club-admin") {
      items.push({
        id: "club",
        label: "Club portal",
        href: "/club-admin/photography",
      });
    }
    return items;
  })();

  if (!page.club) {
    return (
      <main style={{ padding: "4rem 1.5rem", textAlign: "center" }}>
        <h1>Photography Club</h1>
        <p>The club has not been set up yet. Please check back later.</p>
      </main>
    );
  }

  return (
    <ClubPage
      activeHref="/photography-club"
      achievements={page.achievements.map((achievement) => ({
        id: achievement.id,
        title: achievement.title,
        detail: achievement.detail,
        category: achievement.category,
        achievedOn: achievement.achievedOn,
        imageUrl: achievement.imageUrl,
      }))}
      announcements={page.announcements.map((announcement) => ({
        id: announcement.id,
        title: announcement.title,
        body: announcement.body,
        imageUrl: announcement.imageUrl,
        publishedAt: announcement.publishedAt?.toISOString() ?? null,
      }))}
      coverImageUrl={page.club.coverImageUrl}
      backgroundImageUrl={page.club.backgroundImageUrl}
      description={page.club.description}
      events={page.events.map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        location: event.location,
        startsAt: event.startsAt.toISOString(),
        endsAt: event.endsAt?.toISOString() ?? null,
        coverImageUrl: event.coverImageUrl,
      }))}
      extraNavItems={extraNavItems}
      eyebrow="Clubs & societies"
      galleries={page.galleries.map((gallery) => ({
        id: gallery.id,
        slug: gallery.slug,
        title: gallery.title,
        summary: gallery.summary,
        albumUrl: gallery.albumUrl,
        albumLabel: gallery.albumLabel,
      }))}
      name={page.club.name}
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
          "The Photography Club covers the college's events, curates the school's photograph galleries, and publishes the full sets to its albums.",
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <PhotographyClubContent />
    </Suspense>
  ),
});

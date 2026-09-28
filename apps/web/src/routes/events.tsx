import { EventsPage } from "@aloysius/ui/components/pages/events-page";
import type {
  EventPageAchievement,
  EventPageEvent,
} from "@aloysius/ui/components/pages/events-page";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

/**
 * `/events` - the public list of club events and school events.
 *
 * Two changes of behaviour are worth naming, because both were gaps rather than
 * choices:
 *
 * - `listClubEvents` had no caller. A club could submit an event, a reviewer
 *   could approve it, and the approved row was never rendered anywhere. Club
 *   events and school events are now read together here, because to a visitor an
 *   inter-house competition the Debating Society entered and the College's own
 *   sports day are both "an event", and splitting them across two pages would be
 *   an organisational distinction the audience does not have.
 * - `from` is not defaulted to now, so this page can be asked for the past as
 *   well as the future. The default is applied here instead, which also means the
 *   limit is applied after the filter rather than before it.
 *
 * Each event arrives with the galleries linked to it, resolved in the same query.
 * That is the whole reason the page can show photographs: an event stores no
 * images, so "what does this event look like" is answered entirely by its links.
 */

const UPCOMING_LIMIT = 24;

const EventsContent = () => {
  const { data: clubEvents } = useSuspenseQuery(
    orpc.clubs.listClubEvents.queryOptions({
      input: { from: new Date(), limit: UPCOMING_LIMIT },
    })
  );
  const { data: schoolEvents } = useSuspenseQuery(
    orpc.clubs.listEvents.queryOptions({
      input: { from: new Date(), limit: UPCOMING_LIMIT },
    })
  );
  const { data: clubAchievements } = useSuspenseQuery(
    orpc.clubs.listClubAchievements.queryOptions({ input: { limit: 24 } })
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

  /*
   * Merged and sorted in one pass rather than rendering two lists. A visitor
   * asking "what is on this week" does not care which department or club
   * organised it, and two date-ordered lists stacked on each other would make
   * them interleave the dates themselves to answer the question.
   *
   * School events are given no galleries: `gallery_link` can point at them, but
   * `listEvents` does not resolve those links, and rendering a school event with
   * an empty gallery strip would imply its photographs are missing rather than
   * that they were never linked.
   */
  const events: EventPageEvent[] = [
    ...clubEvents.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt?.toISOString() ?? null,
      clubName: event.clubName,
      clubSlug: event.clubSlug,
      coverImageUrl: event.coverImageUrl,
      galleries: event.galleries.map((gallery) => ({
        id: gallery.galleryId,
        slug: gallery.gallerySlug,
        title: gallery.galleryTitle,
        albumUrl: gallery.albumUrl,
        albumLabel: gallery.albumLabel,
        coverImageUrl: null,
      })),
    })),
    ...schoolEvents.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description,
      location: event.location,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt?.toISOString() ?? null,
      clubName: null,
      clubSlug: null,
      coverImageUrl: null,
      galleries: [],
    })),
  ].toSorted(
    (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()
  );

  const achievements: EventPageAchievement[] = clubAchievements.map(
    (achievement) => ({
      id: achievement.id,
      title: achievement.title,
      detail: achievement.detail,
      category: achievement.category,
      achievedOn: achievement.achievedOn,
      clubName: achievement.clubName,
      clubSlug: achievement.clubSlug,
    })
  );

  return (
    <EventsPage
      achievements={achievements}
      events={events}
      extraNavItems={extraNavItems}
    />
  );
};

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events | St. Aloysius' College, Galle" },
      {
        name: "description",
        content:
          "Assemblies, competitions, expeditions and the events run by our clubs and societies at St. Aloysius' College.",
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <EventsContent />
    </Suspense>
  ),
});

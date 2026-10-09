import type { EventPageEvent } from "@aloysius/ui/components/pages/events-page";
import { EventsPage } from "@aloysius/ui/components/pages/events-page";
import { formatNewsDate } from "@aloysius/ui/content/home";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { pageHead } from "@/lib/seo";
import { orpc } from "@/utils/orpc";

/**
 * `/events` - the public list of the Photography Club's events.
 *
 * Events are CMS-direct content now (`cms.listEvents`), not club-scoped, so
 * this is every upcoming event on the site, soonest first. Achievements
 * (`cms.listAchievements`) are read-only, school-wide content with no club
 * of their own either - every one of them shows here.
 */

const CLUB = "photography" as const;
const CLUB_NAME = "Photography Club" as const;

const EventsContent = () => {
  const { data: events } = useSuspenseQuery(orpc.cms.listEvents.queryOptions());
  const { data: achievements } = useSuspenseQuery(
    orpc.cms.listAchievements.queryOptions()
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

  // Read once per mount, not on every render - a `useState` lazy
  // initializer is the one place calling `Date.now()` is safe.
  const [now, setNow] = useState(() => Date.now());
  void setNow;
  const pageEvents: EventPageEvent[] = [];
  for (const event of events) {
    if (new Date(event.startsAt).getTime() < now) {
      continue;
    }
    pageEvents.push({
      clubName: CLUB_NAME,
      clubSlug: CLUB,
      coverImageUrl: event.coverImageUrl,
      description: event.description,
      endsAt: event.endsAt,
      galleries: [],
      id: event.id,
      location: event.location,
      startsAt: event.startsAt,
      title: event.title,
    });
  }

  return (
    <EventsPage
      achievements={achievements.map((achievement) => ({
        id: achievement.id,
        title: achievement.title,
        detail: achievement.detail,
        category: achievement.category,
        achievedOn:
          formatNewsDate(achievement.publishedAt ?? undefined) || null,
        clubName: null,
        clubSlug: null,
      }))}
      events={pageEvents}
      extraNavItems={extraNavItems}
    />
  );
};

export const Route = createFileRoute("/events")({
  head: () =>
    pageHead({
      description:
        "Upcoming events, academic calendar, and achievements at St. Aloysius' College, Galle.",
      path: "/events",
      title: "Events & Calendar | St. Aloysius' College, Galle",
    }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <EventsContent />
    </Suspense>
  ),
});

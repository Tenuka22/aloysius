import type {
  EventPageAchievement,
  EventPageEvent,
} from "@aloysius/ui/components/pages/events-page";
import { EventsPage } from "@aloysius/ui/components/pages/events-page";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

/**
 * `/events` - the public list of the Photography Club's events.
 *
 * There is no school-wide events query to merge in: the flat club model has
 * one seat (`photography`) and no achievements table behind it, so this page
 * is narrower than it once was - a club's own approved events, soonest
 * first, each with no linked galleries (the flat model has no gallery-link
 * concept, only the club's single approved-photo stream at
 * `/galleries/photography`).
 */

const CLUB = "photography" as const;
const CLUB_NAME = "Photography Club" as const;

const NO_ACHIEVEMENTS: readonly EventPageAchievement[] = [];

const EventsContent = () => {
  const { data: events } = useSuspenseQuery(orpc.cms.listEvents.queryOptions());
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
      achievements={NO_ACHIEVEMENTS}
      events={pageEvents}
      extraNavItems={extraNavItems}
    />
  );
};

export const Route = createFileRoute("/events")({
  head: () => ({
    meta: [
      { title: "Events & Calendar | St. Aloysius' College, Galle" },
      {
        name: "description",
        content:
          "Upcoming events, academic calendar, and achievements at St. Aloysius' College, Galle.",
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <EventsContent />
    </Suspense>
  ),
});

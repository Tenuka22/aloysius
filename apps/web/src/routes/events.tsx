import type {
  AgendaAchievement,
  AgendaEvent,
  LeadEvent,
  RecentEvent,
} from "@aloysius/ui/components/events/events-page";
import { EventsPage } from "@aloysius/ui/components/events/events-page";
import { formatNewsDate } from "@aloysius/ui/content/home";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { pageHead } from "@/lib/seo";
import { orpc } from "@/utils/orpc";

/**
 * `/events` - the college's public diary.
 *
 * Events are CMS-direct content (`cms.listEvents`), not club-scoped, so this is
 * every upcoming event on the site, soonest first. Achievements
 * (`cms.listAchievements`) are read-only, school-wide content with no club of
 * their own either - every one of them shows here.
 *
 * The route used to stamp `Photography Club` onto every entry. Events carry
 * `club: null` unless someone attributes them, so that was a label on every
 * event on the site that happened to be false; the page now shows the club only
 * where the record actually has one.
 */

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

  const upcoming: AgendaEvent[] = [];
  const past: RecentEvent[] = [];
  for (const item of events) {
    const startsAt = new Date(item.startsAt).getTime();
    const shared = {
      galleries: item.galleries,
      id: item.id,
      startsAt: item.startsAt,
      title: item.title,
    };

    if (startsAt < now) {
      // The most recent first, so the newest past event is the one a returning
      // visitor is most likely looking for.
      past.push({
        ...shared,
        coverImageUrl: item.coverImageUrl,
        location: item.location,
      });
      continue;
    }

    upcoming.push({
      ...shared,
      clubName: item.clubName,
      coverImageUrl: item.coverImageUrl,
      description: item.description,
      endsAt: item.endsAt,
      location: item.location,
    });
  }
  past.sort((a, b) => b.startsAt.localeCompare(a.startsAt));

  /*
   * The lead is the soonest upcoming event, lifted out of the agenda rather
   * than duplicated in it - the same event appearing twice on one page reads as
   * two events.
   */
  const [soonest, ...laterEvents] = upcoming;
  const lead: LeadEvent | undefined = soonest
    ? {
        clubName: soonest.clubName,
        coverImageUrl: soonest.coverImageUrl,
        description: soonest.description,
        galleries: soonest.galleries,
        id: soonest.id,
        location: soonest.location,
        // Calendar days, not a raw millisecond difference: "in 9 days" is the
        // answer a visitor wants, and truncating to whole days also stops the
        // count ticking over at an arbitrary hour.
        daysAway: Math.max(
          0,
          Math.round(
            (new Date(soonest.startsAt).getTime() - now) / (24 * 60 * 60 * 1000)
          )
        ),
        startsAt: soonest.startsAt,
        title: soonest.title,
      }
    : undefined;

  return (
    <EventsPage
      achievements={achievements.map((achievement): AgendaAchievement => ({
        id: achievement.id,
        title: achievement.title,
        detail: achievement.detail,
        category: achievement.category,
        achievedOn:
          formatNewsDate(achievement.publishedAt ?? undefined) || null,
      }))}
      events={laterEvents}
      extraNavItems={extraNavItems}
      lead={lead}
      recent={past.slice(0, 3)}
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

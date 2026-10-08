import { StudentsPage } from "@aloysius/ui/components/pages/students-page";
import type { StudentEvent } from "@aloysius/ui/components/pages/students-page";
import { blocksToStudentsProps } from "@aloysius/ui/content/cms-to-pages";
import type { GalleryItem } from "@aloysius/ui/content/home";
import { CLUBS } from "@aloysius/ui/content/students";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense, useState } from "react";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

/**
 * `/students` - Student Life.
 *
 * `clubs` is the college's own published list of societies (`content/students`),
 * not a query - there is no more club registry to list, only the one club seat
 * (`photography`) the flat model actually serves. Its approved photographs and
 * upcoming events are still live data, folded into this page's gallery strip
 * and events list; every other club on the list renders as a plain card with no
 * content behind it yet.
 */

const CLUB = "photography" as const;

const StudentsContent = () => {
  const studentsQuery = orpc.cms.getStudents.queryOptions();
  const { data: students } = useSuspenseQuery(studentsQuery);
  const { data: photos } = useSuspenseQuery(
    orpc.club.listApprovedPhotos.queryOptions({ input: { club: CLUB } })
  );
  const { data: events } = useSuspenseQuery(orpc.cms.listEvents.queryOptions());
  const { data: session } = authClient.useSession();

  const cmsProps = students?.blocks
    ? blocksToStudentsProps(students.blocks)
    : {};

  const galleryItems: GalleryItem[] = photos.map((photo) => ({
    id: photo.id,
    image: photo.imageUrl
      ? { src: photo.imageUrl, alt: photo.altText }
      : undefined,
    label: photo.altText || photo.caption,
    preferredRatio: 1.5,
  }));

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
      {...cmsProps}
      achievements={[]}
      clubs={CLUBS}
      events={studentEvents}
      extraNavItems={extraNavItems}
      galleryItems={galleryItems}
    />
  );
};

export const Route = createFileRoute("/students")({
  head: () => ({
    meta: [
      { title: "Student Life | St. Aloysius' College, Galle" },
      {
        name: "description",
        content:
          "Discover the vibrant community, clubs and activities that make St. Aloysius' College a place to grow.",
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <StudentsContent />
    </Suspense>
  ),
});

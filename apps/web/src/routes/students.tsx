import { StudentsPage } from "@aloysius/ui/components/pages/students-page";
import type { StudentEvent } from "@aloysius/ui/components/pages/students-page";
import { blocksToStudentsProps } from "@aloysius/ui/content/cms-to-pages";
import type { GalleryItem } from "@aloysius/ui/content/home";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

const StudentsContent = () => {
  const studentsQuery = orpc.cms.getStudents.queryOptions();
  const { data: students } = useSuspenseQuery(studentsQuery);
  const { data: clubs } = useSuspenseQuery(orpc.clubs.listClubs.queryOptions());
  const { data: achievements } = useSuspenseQuery(
    orpc.clubs.listAchievements.queryOptions({ input: { limit: 12 } })
  );
  const { data: events } = useSuspenseQuery(
    orpc.clubs.listEvents.queryOptions({ input: { limit: 8 } })
  );
  const { data: media } = useSuspenseQuery(
    orpc.clubs.getFeaturedMedia.queryOptions({
      input: { clubSlug: "photography" },
    })
  );
  const { data: session } = authClient.useSession();

  const cmsProps = students?.blocks
    ? blocksToStudentsProps(students.blocks)
    : {};

  const galleryItems: GalleryItem[] = [...media.covers, ...media.trending].map(
    ({ item, galleryTitle }) => ({
      id: item.id,
      label: item.altText || item.caption || galleryTitle,
      preferredRatio: 1.5,
    })
  );
  const studentEvents: StudentEvent[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    startsAt: event.startsAt.toISOString(),
    location: event.location,
  }));

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
      achievements={achievements}
      events={studentEvents}
      galleryItems={galleryItems}
      clubs={clubs.map((club) => ({
        ...club,
        description: club.description ?? undefined,
        coverImageUrl: club.coverImageUrl,
      }))}
      extraNavItems={extraNavItems}
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

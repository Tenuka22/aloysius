import type { ImageSource } from "@aloysius/ui/components/primitives/media";
import { StudentsPage } from "@aloysius/ui/components/students/students-page";
import { blocksToStudentsProps } from "@aloysius/ui/content/cms-to-pages";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { pageHead } from "@/lib/seo";
import { orpc } from "@/utils/orpc";

/**
 * `/students` - Student Life.
 *
 * The page is the approved design's own content (`content/students.ts`): the
 * sports lists, the society names, the annual encounters and the houses. Three
 * things come from the CMS - the hero title and tagline, the photograph on
 * each main-sport tile (`cms.listSportTiles`, matched to the sport by name)
 * and the description under each society (`cms.listPublishedClubs`, matched to
 * the club by name).
 */

const StudentsContent = () => {
  const studentsQuery = orpc.cms.getStudents.queryOptions();
  const { data: students } = useSuspenseQuery(studentsQuery);
  const { data: clubs } = useSuspenseQuery(
    orpc.cms.listPublishedClubs.queryOptions()
  );
  const { data: sportTileRows } = useSuspenseQuery(
    orpc.cms.listSportTiles.queryOptions()
  );
  const { data: session } = authClient.useSession();

  const cmsProps = blocksToStudentsProps(students?.blocks ?? []);

  const sportImages: Record<string, ImageSource> = {};
  for (const row of sportTileRows) {
    if (row.imageUrl) {
      sportImages[row.name.toLowerCase()] = {
        src: row.imageUrl,
        alt: `${row.name} photograph`,
      };
    }
  }

  const clubDescriptions: Record<string, string> = {};
  for (const club of clubs) {
    if (club.description) {
      clubDescriptions[club.name.toLowerCase()] = club.description;
    }
  }

  const extraNavItems = (() => {
    if (!session?.user) {
      return [];
    }
    const items = [];
    const { role } = session.user;
    if (role === "admin") {
      items.push({ id: "admin", label: "Admin", href: "/admin" });
    }
    return items;
  })();

  return (
    <StudentsPage
      clubDescriptions={clubDescriptions}
      extraNavItems={extraNavItems}
      heading={cmsProps.heading}
      sportImages={sportImages}
      tagline={cmsProps.tagline}
    />
  );
};

export const Route = createFileRoute("/students")({
  head: () =>
    pageHead({
      description:
        "Sports, societies, houses and the traditions that shape every Aloysian at St. Aloysius' College, Galle.",
      path: "/students",
      title: "Student Life | St. Aloysius' College, Galle",
    }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <StudentsContent />
    </Suspense>
  ),
});

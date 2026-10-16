import { AcademicsPage } from "@aloysius/ui/components/academics/academics-page";
import { blocksToAcademicsHeaderProps } from "@aloysius/ui/content/cms-to-pages";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { pageHead } from "@/lib/seo";
import { orpc } from "@/utils/orpc";

/**
 * `/academics` - curriculum, streams and departments.
 *
 * Sections of study and A/L streams are real shipped copy
 * (`content/academics.ts`), not CMS-editable - see `cms-to-pages.ts`'s note on
 * `ACADEMICS_BLOCKS`. The page header is CMS content, and the facilities
 * showcase is the `facility` table, edited as a roster at `/cms/facilities`.
 *
 * The leadership section that used to be here is gone: the Principal, the
 * Primary sectional head and the Secondary deputy principal are all on `/about`
 * now, in the academic-heads roster at `/cms/academic-heads`. They were being
 * rendered twice, here and there, from two different sets of photographs.
 */

const AcademicsContent = () => {
  const academicsQuery = orpc.cms.getAcademics.queryOptions();
  const { data: academics } = useSuspenseQuery(academicsQuery);
  const facilitiesQuery = orpc.cms.listFacilities.queryOptions();
  const { data: facilityRows } = useSuspenseQuery(facilitiesQuery);
  const { data: session } = authClient.useSession();

  const facilities = facilityRows.map((row) => ({
    id: row.id,
    name: row.name,
    tag: row.tag,
    description: row.description ?? "",
    image: row.imageUrl ? { alt: row.name, src: row.imageUrl } : undefined,
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
    <AcademicsPage
      extraNavItems={extraNavItems}
      facilities={facilities}
      header={
        academics?.blocks
          ? blocksToAcademicsHeaderProps(academics.blocks)
          : undefined
      }
    />
  );
};

export const Route = createFileRoute("/academics")({
  head: () =>
    pageHead({
      description:
        "Curriculum, streams and facilities at St. Aloysius' College, Galle - primary and secondary sections, the four G.C.E. Advanced Level streams, and the college's facilities.",
      path: "/academics",
      title: "Academics | St. Aloysius' College, Galle",
    }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <AcademicsContent />
    </Suspense>
  ),
});

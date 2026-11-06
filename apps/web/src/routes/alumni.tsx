import { AlumniPage } from "@aloysius/ui/components/alumni/alumni-page";
import type { BranchDetails } from "@aloysius/ui/components/alumni/branches";
import type { NotablePortraits } from "@aloysius/ui/components/alumni/distinguished";
import { blocksToAlumniProps } from "@aloysius/ui/content/cms-to-pages";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { pageHead } from "@/lib/seo";
import { orpc } from "@/utils/orpc";

/**
 * `/alumni` - the Old Boys' Association.
 *
 * The page is the approved design's own content (`content/alumni.ts`): the
 * branches, the four featured Aloysians and the wider roll. Three things come
 * from the CMS - the hero title and tagline, each branch's contact line and
 * page link (`cms.listAlumniBranches`, matched to the branch by name) and each
 * featured Aloysian's portrait (`cms.listAlumniNotables`, matched by name).
 */

const AlumniContent = () => {
  const alumniQuery = orpc.cms.getAlumni.queryOptions();
  const { data: alumni } = useSuspenseQuery(alumniQuery);
  const notablesQuery = orpc.cms.listAlumniNotables.queryOptions();
  const { data: notableRows } = useSuspenseQuery(notablesQuery);
  const branchesQuery = orpc.cms.listAlumniBranches.queryOptions();
  const { data: branchRows } = useSuspenseQuery(branchesQuery);
  const { data: session } = authClient.useSession();

  /* Always call the mapper so an unpublished page falls back to content/alumni.ts. */
  const cmsProps = blocksToAlumniProps(alumni?.blocks ?? []);

  const branchDetails: Record<string, BranchDetails[string]> = {};
  for (const row of branchRows) {
    branchDetails[row.name.toLowerCase()] = {
      contact: row.contact ?? undefined,
      href: row.href ?? undefined,
    };
  }

  const portraits: Record<string, NotablePortraits[string]> = {};
  for (const row of notableRows) {
    if (row.imageUrl) {
      portraits[row.name.toLowerCase()] = { alt: row.name, src: row.imageUrl };
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
    <AlumniPage
      branchDetails={branchDetails}
      extraNavItems={extraNavItems}
      heading={cmsProps.heading}
      portraits={portraits}
      tagline={cmsProps.tagline}
    />
  );
};

export const Route = createFileRoute("/alumni")({
  head: () =>
    pageHead({
      description:
        "The Old Boys' Association of St. Aloysius' College - connecting generations of Aloysians worldwide.",
      path: "/alumni",
      title: "Alumni | St. Aloysius' College, Galle",
    }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <AlumniContent />
    </Suspense>
  ),
});

import { AlumniPage } from "@aloysius/ui/components/pages/alumni-page";
import { ALUMNI_NOTABLE_CATEGORY_LABELS } from "@aloysius/ui/content/alumni";
import type {
  AlumniBranch,
  DistinguishedAloysian,
} from "@aloysius/ui/content/alumni";
import { blocksToAlumniProps } from "@aloysius/ui/content/cms-to-pages";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { pageHead } from "@/lib/seo";
import { orpc } from "@/utils/orpc";

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

  const notables: DistinguishedAloysian[] = notableRows.map((row) => ({
    field: ALUMNI_NOTABLE_CATEGORY_LABELS[row.category] ?? row.category,
    id: row.id,
    image: row.imageUrl ? { alt: row.name, src: row.imageUrl } : undefined,
    name: row.name,
    role: row.role ?? undefined,
  }));

  const branches: AlumniBranch[] = branchRows.map((row) => ({
    contact: row.contact ?? undefined,
    href: row.href ?? undefined,
    id: row.id,
    name: row.name,
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
    <AlumniPage
      branches={branches}
      extraNavItems={extraNavItems}
      heading={cmsProps.heading}
      notables={notables}
      obaHref={cmsProps.obaHref}
      obaLabel={cmsProps.obaLabel}
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

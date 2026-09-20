import { AlumniPage } from "@aloysius/ui/components/pages/alumni-page";
import { blocksToAlumniProps } from "@aloysius/ui/content/cms-to-pages";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

const AlumniContent = () => {
  const alumniQuery = orpc.cms.getAlumni.queryOptions();
  const { data: alumni } = useSuspenseQuery(alumniQuery);
  const { data: session } = authClient.useSession();

  const cmsProps = alumni?.blocks ? blocksToAlumniProps(alumni.blocks) : {};

  const extraNavItems = (() => {
    if (!session?.user) {
      return [];
    }
    const items = [];
    const { role } = session.user;
    if (role === "admin" || role === "cms") {
      items.push({ id: "cms", label: "CMS", href: "/cms" });
    }
    return items;
  })();

  return <AlumniPage {...cmsProps} extraNavItems={extraNavItems} />;
};

export const Route = createFileRoute("/alumni")({
  head: () => ({
    meta: [
      { title: "Alumni | St. Aloysius' College, Galle" },
      {
        name: "description",
        content:
          "The Old Boys' Association of St. Aloysius' College - connecting generations of Aloysians worldwide.",
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <AlumniContent />
    </Suspense>
  ),
});

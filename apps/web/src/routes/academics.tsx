import type { AcademicsLeader } from "@aloysius/ui/components/academics/academics-leadership";
import { AcademicsPage } from "@aloysius/ui/components/academics/academics-page";
import { blocksToAcademicsLeadership } from "@aloysius/ui/content/cms-to-pages";
import { principalContent } from "@aloysius/ui/content/cms-to-principal";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

/**
 * `/academics` - curriculum, streams and departments.
 *
 * Sections of study, A/L streams, subject departments and results are real
 * shipped copy (`content/academics.ts`), not CMS-editable yet - see
 * `cms-to-pages.ts`'s note on `ACADEMICS_BLOCKS`. The one live section is
 * leadership: the Principal (`cms.getPrincipal`, the same global block every
 * other page reads) alongside the Primary section's sectional head and the
 * Secondary section's deputy principal (`cms.getAcademics`).
 */

const AcademicsContent = () => {
  const academicsQuery = orpc.cms.getAcademics.queryOptions();
  const { data: academics } = useSuspenseQuery(academicsQuery);
  const principalQuery = orpc.cms.getPrincipal.queryOptions();
  const { data: principal } = useSuspenseQuery(principalQuery);
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

  const principalInfo = principalContent(principal?.blocks);
  const { primaryHead, secondaryDeputy } = academics?.blocks
    ? blocksToAcademicsLeadership(academics.blocks)
    : { primaryHead: {}, secondaryDeputy: {} };

  const leaders: AcademicsLeader[] = [
    {
      role: "Principal",
      name: principalInfo.name,
      title: principalInfo.role,
      photo: principalInfo.portrait,
    },
    {
      role: "Primary Section",
      name: primaryHead.name,
      title: primaryHead.title,
      photo: primaryHead.photo,
    },
    {
      role: "Secondary Section",
      name: secondaryDeputy.name,
      title: secondaryDeputy.title,
      photo: secondaryDeputy.photo,
    },
  ];

  return <AcademicsPage extraNavItems={extraNavItems} leaders={leaders} />;
};

export const Route = createFileRoute("/academics")({
  head: () => ({
    meta: [
      { title: "Academics | St. Aloysius' College, Galle" },
      {
        name: "description",
        content:
          "Curriculum, streams and departments at St. Aloysius' College, Galle - primary and secondary sections, the four G.C.E. Advanced Level streams, and the college's nine subject departments.",
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <AcademicsContent />
    </Suspense>
  ),
});

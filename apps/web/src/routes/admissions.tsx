import { AdmissionsPage } from "@aloysius/ui/components/pages/admissions-page";
import {
  ADMISSIONS_DATES,
  ADMISSIONS_DOWNLOADS,
  ADMISSIONS_FAQS,
  ADMISSIONS_REQUIREMENTS,
  APPLICATION_STEPS,
} from "@aloysius/ui/content/admissions";
import { blocksToAdmissionsProps } from "@aloysius/ui/content/cms-to-pages";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

const AdmissionsContent = () => {
  const admissionsQuery = orpc.cms.getAdmissions.queryOptions();
  const { data: admissions } = useSuspenseQuery(admissionsQuery);
  const { data: session } = authClient.useSession();

  const cmsProps = admissions?.blocks
    ? blocksToAdmissionsProps(admissions.blocks)
    : {};

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
    <AdmissionsPage
      {...cmsProps}
      dates={ADMISSIONS_DATES}
      downloads={ADMISSIONS_DOWNLOADS}
      extraNavItems={extraNavItems}
      faqs={ADMISSIONS_FAQS}
      requirements={ADMISSIONS_REQUIREMENTS}
      steps={APPLICATION_STEPS}
    />
  );
};

export const Route = createFileRoute("/admissions")({
  head: () => ({
    meta: [
      { title: "Admissions | St. Aloysius' College, Galle" },
      {
        name: "description",
        content:
          "How to apply to St. Aloysius' College, Galle - the application process, requirements, key dates, downloads and frequently asked questions.",
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <AdmissionsContent />
    </Suspense>
  ),
});

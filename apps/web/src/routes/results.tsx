import { ResultsPage } from "@aloysius/ui/components/results/results-page";
import { createFileRoute } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import { pageHead } from "@/lib/seo";

/**
 * `/results` - A/L rankers, O/L 9A achievers and Grade 5 Scholarship passers.
 *
 * The figures live in `content/results.ts` (`RESULTS_BY_YEAR`), not the CMS:
 * they are published once a year and the College supplies them as a list, so a
 * typed file is the simplest thing to edit. Until a year is added the page
 * renders its empty states.
 */

const ResultsContent = () => {
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

  return <ResultsPage extraNavItems={extraNavItems} />;
};

export const Route = createFileRoute("/results")({
  head: () =>
    pageHead({
      description:
        "Examination results at St. Aloysius' College, Galle - G.C.E. Advanced Level rankers, Ordinary Level 9A achievers and Grade 5 Scholarship passers.",
      path: "/results",
      title: "Examinations & Results | St. Aloysius' College, Galle",
    }),
  component: ResultsContent,
});

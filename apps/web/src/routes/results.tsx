import { ResultsPage } from "@aloysius/ui/components/results/results-page";
import type { YearResults } from "@aloysius/ui/content/results";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { pageHead } from "@/lib/seo";
import { orpc } from "@/utils/orpc";

/**
 * `/results` - A/L rankers, O/L 9A achievers and Grade 5 Scholarship passers.
 *
 * The figures are database content (`resultsYear` and its children, published
 * at `/cms/results`), read through `cms.listResults`. They used to be
 * `RESULTS_BY_YEAR` in `content/results.ts`, where the empty object rendered
 * four year tabs that all said the results had not been published - a page that
 * looked broken because the data had nowhere to be entered.
 *
 * A published year the CMS has no rows for still renders its honest empty
 * states, and a year with no rows at all is not offered, because the tabs come
 * from the years that exist rather than from a hardcoded list.
 */

/**
 * A stored `imageUrl` as the `ImageSource` the page's components take.
 *
 * Module scope rather than inside the component: it captures nothing, and
 * defining it per render recreated the function on every pass.
 *
 * The alt text is the student's own name. These are portrait cards of named
 * people, and "Portrait" on all twenty of them tells a screen-reader user
 * nothing.
 */
const withImage = <T extends { name: string; imageUrl: string | null }>(
  entry: T
) => ({
  ...entry,
  ...(entry.imageUrl
    ? { image: { src: entry.imageUrl, alt: entry.name } }
    : {}),
});

const ResultsContent = () => {
  const resultsQuery = orpc.cms.listResults.queryOptions();
  const { data: publishedYears } = useSuspenseQuery(resultsQuery);
  const { data: session } = authClient.useSession();

  const years = publishedYears.map((year) => year.year);

  /*
   * The router returns a flat `imageUrl` per student, the way `listNewsPosts`
   * returns `coverImageUrl` - a url is what the database knows. `ResultsPage`
   * takes `YearResults`, whose images are `ImageSource`s, so the two are
   * bridged here rather than by making the router know about presentation.
   */
  const results: Record<string, YearResults> = Object.fromEntries(
    publishedYears.map((year) => {
      const alRankers = Object.fromEntries(
        Object.entries(year.alRankers).map(([stream, entries]) => [
          stream,
          entries.map(withImage),
        ])
      );

      return [
        year.year,
        {
          summary: year.summary,
          alRankers,
          nineA: {
            ...year.nineA,
            students: year.nineA.students.map(withImage),
          },
          scholarship: {
            ...year.scholarship,
            top: year.scholarship.top.map(withImage),
            list: year.scholarship.list.map(withImage),
          },
        } as YearResults,
      ];
    })
  );

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
    <ResultsPage
      extraNavItems={extraNavItems}
      results={results}
      years={years}
    />
  );
};

export const Route = createFileRoute("/results")({
  head: () =>
    pageHead({
      description:
        "Examination results at St. Aloysius' College, Galle - G.C.E. Advanced Level rankers, Ordinary Level 9A achievers and Grade 5 Scholarship passers.",
      path: "/results",
      title: "Examinations & Results | St. Aloysius' College, Galle",
    }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <ResultsContent />
    </Suspense>
  ),
});

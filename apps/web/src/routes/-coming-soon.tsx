import { UnderConstructionPage } from "@aloysius/ui/components/status/under-construction-page";

/**
 * Shared route factory for sections the CMS has not published yet.
 *
 * Files prefixed with `-` are excluded from TanStack Router's file-based route
 * generation, so this module is a plain helper that lives beside the routes it
 * serves rather than a route of its own.
 *
 * Each of these URLs already appears in the site header, so without them every
 * nav item 404s. They return 200 with a `noindex` robots directive: the page is
 * real and reachable, but an empty placeholder must never enter the search
 * index under a name the finished section will want to rank for.
 */
export const comingSoonRoute = (
  sectionName: string,
  percentComplete?: number
) => ({
  head: () => ({
    meta: [
      { title: `${sectionName} - coming soon | St. Aloysius' College, Galle` },
      {
        name: "description",
        content: `The ${sectionName} section of the St. Aloysius' College website is being prepared and will be published shortly.`,
      },
      { name: "robots", content: "noindex, follow" },
    ],
  }),
  component: () => (
    <UnderConstructionPage
      percentComplete={percentComplete}
      sectionName={sectionName}
    />
  ),
});

import { CmsApp } from "@aloysius/ui/components/cms/cms-app";
import { createFileRoute } from "@tanstack/react-router";

/**
 * The content manager, at /cms.
 *
 * Deliberately ungated for now: the auth and RBAC work is happening separately,
 * so this renders for anyone who knows the URL. Before this goes anywhere
 * public it needs the site-admin middleware in `src/middleware/site-admin.ts`
 * attached here as a `beforeLoad` guard - the middleware already exists, it is
 * simply not wired up while the backend is in flight.
 *
 * `noindex` is set regardless, so an admin screen never lands in a search
 * result even if the route is reachable.
 */
export const Route = createFileRoute("/cms")({
  head: () => ({
    meta: [
      { title: "Content Manager — St. Aloysius' College" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: () => <CmsApp />,
});

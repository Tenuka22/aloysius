import { AcademicsPage } from "@aloysius/ui/components/academics/academics-page";
import { createFileRoute } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";

const AcademicsContent = () => {
  const { data: session } = authClient.useSession();

  /*
   * Role-gated nav entries, mirroring `/` and `/about`. No Suspense wrapper
   * here: unlike those routes this page has no CMS query to await - its content
   * is static, so it server-renders in one pass.
   */
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

  return <AcademicsPage extraNavItems={extraNavItems} />;
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
  component: AcademicsContent,
});

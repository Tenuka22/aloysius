import { AboutPage } from "@aloysius/ui/components/about/about-page";
import { FOUNDERS, TIMELINE, ANTHEM_IMAGE } from "@aloysius/ui/content/about";
import { blocksToAboutImages } from "@aloysius/ui/content/cms-to-about";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { orpc } from "@/utils/orpc";

const AboutContent = () => {
  const aboutQuery = orpc.cms.getAbout.queryOptions();
  const { data: about } = useSuspenseQuery(aboutQuery);
  const { data: session } = authClient.useSession();

  const images = about?.blocks
    ? blocksToAboutImages(about.blocks, {
        founder1: FOUNDERS[0].image ?? { src: "", alt: FOUNDERS[0].name },
        founder2: FOUNDERS[1].image ?? { src: "", alt: FOUNDERS[1].name },
        history1: TIMELINE[0].image ?? { src: "", alt: TIMELINE[0].title },
        history2: TIMELINE[1].image ?? { src: "", alt: TIMELINE[1].title },
        history3: TIMELINE[2].image ?? { src: "", alt: TIMELINE[2].title },
        history4: TIMELINE[3].image ?? { src: "", alt: TIMELINE[3].title },
        anthem: ANTHEM_IMAGE,
      })
    : undefined;

  const extraNavItems = (() => {
    if (!session?.user) {
      return [];
    }
    const items = [];
    const { role } = session.user;
    if (role === "admin" || role === "cms") {
      items.push({ id: "cms", label: "CMS", href: "/cms" });
    }
    if (role === "admin" || role === "teacher") {
      items.push({
        id: "students-admin",
        label: "Manage Students",
        href: "/student-officer",
      });
    }
    if (role === "admin" || role === "teacher") {
      items.push({
        id: "teachers-admin",
        label: "Staff",
        href: "/teacher",
      });
    }
    if (role === "admin") {
      items.push({ id: "admin", label: "Admin", href: "/admin" });
    }
    return items;
  })();

  return <AboutPage images={images} extraNavItems={extraNavItems} />;
};

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About | St. Aloysius' College, Galle" },
      {
        name: "description",
        content:
          "The history, mission and people of St. Aloysius' College, Galle - founders, vision and mission, motto, principal's message and college anthem.",
      },
    ],
  }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <AboutContent />
    </Suspense>
  ),
});

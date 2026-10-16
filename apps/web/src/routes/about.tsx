import { AboutPage } from "@aloysius/ui/components/about/about-page";
import {
  ABOUT_HERO_INTRO,
  ABOUT_HERO_TITLE,
  HISTORY_HEADING,
  TIMELINE,
  ANTHEM_IMAGE,
} from "@aloysius/ui/content/about";
import {
  blocksToAboutHeader,
  blocksToAboutImages,
  blocksToAboutText,
} from "@aloysius/ui/content/cms-to-about";
import { principalContent } from "@aloysius/ui/content/cms-to-principal";
import type { AcademicHead } from "@aloysius/ui/content/people";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "@/lib/auth-client";
import { pageHead } from "@/lib/seo";
import { orpc } from "@/utils/orpc";

const AboutContent = () => {
  const aboutQuery = orpc.cms.getAbout.queryOptions();
  const { data: about } = useSuspenseQuery(aboutQuery);
  /*
   * The Principal's Message is a global block with its own editor screen, so
   * the About page reads the same content the homepage does rather than keeping
   * its own copy.
   */
  const principalQuery = orpc.cms.getPrincipal.queryOptions();
  const { data: principal } = useSuspenseQuery(principalQuery);
  const headsQuery = orpc.cms.listAcademicHeads.queryOptions();
  const { data: heads } = useSuspenseQuery(headsQuery);
  const { data: session } = authClient.useSession();

  const images = about?.blocks
    ? blocksToAboutImages(about.blocks, {
        history1: TIMELINE[0].image ?? { src: "", alt: TIMELINE[0].title },
        history2: TIMELINE[1].image ?? { src: "", alt: TIMELINE[1].title },
        history3: TIMELINE[2].image ?? { src: "", alt: TIMELINE[2].title },
        history4: TIMELINE[3].image ?? { src: "", alt: TIMELINE[3].title },
        anthem: ANTHEM_IMAGE,
        anthemSinhala: ANTHEM_IMAGE,
      })
    : undefined;

  const text = about?.blocks
    ? blocksToAboutText(about.blocks, {
        historyHeading: HISTORY_HEADING,
      })
    : undefined;

  const header = about?.blocks
    ? blocksToAboutHeader(about.blocks, {
        eyebrow: "About the College",
        heading: ABOUT_HERO_TITLE,
        tagline: ABOUT_HERO_INTRO,
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
    if (role === "admin") {
      items.push({ id: "admin", label: "Admin", href: "/admin" });
    }
    return items;
  })();

  /*
   * The router returns a flat `imageUrl` per person; `AcademicHead` takes an
   * `ImageSource`. Same bridge as `/results`, and the alt text is the person's
   * name so a screen reader announces who the portrait is of.
   */
  const academicHeads: AcademicHead[] = heads.map((head) => ({
    id: head.id,
    slug: head.slug,
    name: head.name,
    role: head.role,
    bio: head.bio,
    ...(head.imageUrl ? { image: { src: head.imageUrl, alt: head.name } } : {}),
  }));

  return (
    <AboutPage
      academicHeads={academicHeads}
      header={header}
      images={images}
      text={text}
      principal={principalContent(principal?.blocks)}
      extraNavItems={extraNavItems}
    />
  );
};

export const Route = createFileRoute("/about")({
  head: () =>
    pageHead({
      description:
        "The history, mission and people of St. Aloysius' College, Galle - history, vision and mission, motto, principal's message and college anthem.",
      path: "/about",
      title: "About | St. Aloysius' College, Galle",
    }),
  component: () => (
    <Suspense fallback={<div>Loading…</div>}>
      <AboutContent />
    </Suspense>
  ),
});

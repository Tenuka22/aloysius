import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef } from "react";

import type { CmsBlock } from "../../content/cms-to-home";
import { blocksToProps } from "../../content/cms-to-home";
import { DEFAULT_NOTICE } from "../../content/home";
import type {
  Achievement,
  NavItem,
  NewsItem,
  Notice,
} from "../../content/home";
import { SkipLink } from "../primitives/layout";
import { NoticeBar } from "../site/notice-bar";
import { SiteFooter } from "../site/site-footer";
import type { FooterContact } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";
import { Academics } from "./academics";
import { Achievements } from "./achievements";
import { Alumni } from "./alumni";
import { Gallery } from "./gallery";
import { Heritage } from "./heritage";
import { Hero } from "./hero";
import { News } from "./news";
import { PrincipalMessage } from "./principal-message";
import { StudentLife } from "./student-life";

const MAIN_ID = "main-content";

const NO_NEWS: readonly NewsItem[] = [];
const NO_ACHIEVEMENTS: readonly Achievement[] = [];

const styles = stylex.create({
  main: {
    display: "block",
    outline: {
      default: null,
      ":focus": "none",
    },
  },
});

export interface HomePageProps {
  notice?: Notice;
  featuredNews?: NewsItem;
  news?: readonly NewsItem[];
  achievements?: readonly Achievement[];
  contact?: FooterContact;
  principalName?: string;
  tagline?: string;
  blocks?: CmsBlock[];
  extraNavItems?: readonly NavItem[];
}

/*
 * Page composition root with ~10 independent, optional sections toggled by
 * CMS visibility flags; each branch is trivial and self-contained, not
 * deeply coupled control flow.
 */
// oxlint-disable-next-line eslint/complexity
export const HomePage = ({
  notice,
  featuredNews,
  news = NO_NEWS,
  achievements = NO_ACHIEVEMENTS,
  contact,
  principalName,
  tagline,
  blocks,
  extraNavItems,
}: HomePageProps) => {
  const cms = blocks ? blocksToProps(blocks) : undefined;
  const h = cms?.hidden;

  const resolvedNotice = notice ?? cms?.notice ?? DEFAULT_NOTICE;
  const resolvedTagline = tagline ?? cms?.heroTagline;
  const resolvedPrincipalName = principalName ?? cms?.principalName;

  const headerRef = useRef<HTMLDivElement>(null);

  // The hero's min-height is `92svh - header height` so it fits just under
  // the fold on load. The notice bar is optional and can wrap to two lines,
  // so the combined stack height isn't a fixed constant - measure it instead
  // of guessing, or the hero ends up taller than the remaining viewport and
  // leaves dead space above the next section.
  useEffect(() => {
    const node = headerRef.current;
    if (!node) {
      return;
    }
    const root = document.documentElement;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) {
        root.style.setProperty(
          "--header-height",
          `${entry.contentRect.height}px`
        );
      }
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <SkipLink targetId={MAIN_ID} />
      <div ref={headerRef}>
        {!h?.notice && <NoticeBar notice={resolvedNotice} />}
        <SiteHeader activeHref="/" extraNavItems={extraNavItems} />
      </div>
      <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
        {!h?.hero && (
          <Hero
            background={cms?.heroBackground}
            tagline={resolvedTagline}
            motto={cms?.heroMotto}
            place={cms?.heroPlace}
            cta1={cms?.heroCta1}
            cta2={cms?.heroCta2}
          />
        )}
        {!h?.heritage && (
          <Heritage
            intro={cms?.heritageIntro}
            eyebrow={cms?.heritageEyebrow}
            heading={cms?.heritageHeading}
            foundedYear={
              cms?.heritageFounded
                ? Number(cms.heritageFounded) || undefined
                : undefined
            }
          />
        )}
        {!h?.principal && (
          <PrincipalMessage
            name={resolvedPrincipalName}
            quote={cms?.principalQuote}
          />
        )}
        {!h?.academics && <Academics />}
        {!h?.life && <StudentLife />}
        {!h?.news && <News featured={featuredNews} items={news} />}
        {!h?.achievements && <Achievements achievements={achievements} />}
        {!h?.alumni && <Alumni />}
        {!h?.gallery && <Gallery />}
      </main>
      <SiteFooter contact={contact} />
    </>
  );
};

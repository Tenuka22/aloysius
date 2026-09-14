import * as stylex from "@stylexjs/stylex";

import { DEFAULT_NOTICE } from "../../content/home";
import type { Achievement, NewsItem, Notice } from "../../content/home";
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
    /*
     * `tabIndex={-1}` below makes <main> programmatically focusable so the skip
     * link actually moves focus. That also makes it match `:focus-visible` in
     * some browsers, which would draw the global 3px ring around the entire
     * page - so the ring is suppressed for this one element.
     */
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
}

/**
 * Homepage composition. Every section takes its content as props with defaults,
 * so the CMS can be wired in later without touching layout code.
 */
export const HomePage = ({
  notice = DEFAULT_NOTICE,
  featuredNews,
  news = NO_NEWS,
  achievements = NO_ACHIEVEMENTS,
  contact,
  principalName,
  tagline,
}: HomePageProps) => (
  <>
    <SkipLink targetId={MAIN_ID} />
    <NoticeBar notice={notice} />
    <SiteHeader activeHref="/" />

    {/*
      `tabIndex={-1}` is what makes the skip link work. Without it Safari and
      Firefox scroll to the target but leave focus on the link, so the next Tab
      lands back in the header and the user is looped into the nav again.
    */}
    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      <Hero tagline={tagline} />
      <Heritage />
      <PrincipalMessage name={principalName} />
      <Academics />
      <StudentLife />
      <News featured={featuredNews} items={news} />
      <Achievements achievements={achievements} />
      <Alumni />
      <Gallery />
    </main>

    <SiteFooter contact={contact} />
  </>
);

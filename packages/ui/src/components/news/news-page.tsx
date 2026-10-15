import * as stylex from "@stylexjs/stylex";
import { useState } from "react";

import type { NavItem } from "../../content/home";
import {
  ALL_CATEGORIES,
  categoriesPresentIn,
  COLLEGE_EVENTS,
  FEATURED_STORY,
  NEWS_STORIES,
} from "../../content/news";
import type { CollegeEvent, NewsStory } from "../../content/news";
import { SkipLink } from "../primitives/layout";
import { SiteFooter } from "../site/site-footer";
import type { FooterContact } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";
import { FeaturedStory } from "./featured-story";
import { NewsArchive } from "./news-archive";
import type { Filter } from "./news-archive";
import { NewsHero } from "./news-hero";
import { UpcomingEvents } from "./upcoming-events";

const MAIN_ID = "main-content";

const styles = stylex.create({
  /*
   * `tabIndex={-1}` on <main> is what lets the skip link move focus here, but
   * it also makes the whole region focusable, so the global focus ring would
   * draw a 3px outline around the entire page. Suppressed on `:focus` only.
   */
  main: {
    display: "block",
    outline: {
      default: null,
      ":focus": "none",
    },
  },
});

export interface NewsPageProps {
  /** CMS `news-header` copy; falls back to the hero's own constants. */
  heading?: string;
  tagline?: string;
  contact?: FooterContact;
  extraNavItems?: readonly NavItem[];
  /** The lead story. Omitted, the featured section does not render. */
  featured?: NewsStory | null;
  /** The archive. Empty, the grid shows its "nothing published yet" state. */
  stories?: readonly NewsStory[];
  /** The calendar. Empty, the events section shows its empty state. */
  events?: readonly CollegeEvent[];
}

export const NewsPage = ({
  heading,
  tagline,
  contact,
  extraNavItems,
  featured = FEATURED_STORY,
  stories = NEWS_STORIES,
  events = COLLEGE_EVENTS,
}: NewsPageProps) => {
  /*
   * The category chips sit in the hero (as in the design) but filter the
   * archive two sections down, so the choice lives here. `key={filter}` on the
   * archive resets its page number whenever the category changes.
   */
  const [filter, setFilter] = useState<Filter>(ALL_CATEGORIES);

  return (
    <>
      <SkipLink targetId={MAIN_ID} />
      <SiteHeader activeHref="/news" extraNavItems={extraNavItems} />
      <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
        <NewsHero
          intro={tagline}
          title={heading}
          categories={categoriesPresentIn(stories)}
          filter={filter}
          onFilterChange={(next) => setFilter(next as Filter)}
        />
        <FeaturedStory story={featured ?? undefined} />
        <NewsArchive filter={filter} key={filter} stories={stories} />
        <UpcomingEvents events={events} />
      </main>
      <SiteFooter contact={contact} />
    </>
  );
};

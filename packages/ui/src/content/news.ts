import type { NewsCategory, NewsItem } from "./home";

/**
 * Content for the News & Events page.
 *
 * Same rule as `content/students.ts` and `content/academics.ts`: every string
 * here is real copy, never a `[CMS: …]` marker. Facts the college has not
 * published - the date a story ran, its excerpt, the events calendar - are
 * modelled as optional fields or empty collections, and the components degrade
 * to an honest empty state rather than inventing a headline or a date.
 */

export const NEWS_HERO_TITLE = "News & Events";
export const NEWS_HERO_INTRO =
  "Results, fixtures, feast days and circulars - what is happening at St. Aloysius' College, and what is coming next.";

/**
 * A story in the archive.
 *
 * `excerpt` and `date` are optional because most of the archive predates the
 * CMS: a story whose publication date was never recorded renders without a
 * date rather than with a guessed one.
 */
export interface NewsStory extends NewsItem {
  excerpt?: string;
}

/**
 * The stories the college has actually published.
 *
 * This is the single source for both the homepage teaser strip and the full
 * archive, so the two can never drift apart. It is deliberately short: adding
 * plausible-looking headlines to fill the grid would be inventing news.
 */
export const FEATURED_STORY: NewsStory = {
  id: "featured",
  category: "College News",
  title: "Aloysians mark another year of service, scholarship and sport",
  href: "/news",
};

export const NEWS_STORIES: readonly NewsStory[] = [
  {
    id: "news-1",
    category: "Academic",
    title: "Advanced Level results announced for the 2025 cohort",
    href: "/news",
  },
  {
    id: "news-2",
    category: "Sports",
    title: "First XI cricket team retains the Southern Province title",
    href: "/news",
  },
  {
    id: "news-3",
    category: "Events",
    title: "Annual prize giving held in the college main hall",
    href: "/news",
  },
  {
    id: "news-4",
    category: "Announcements",
    title: "Circular: term dates and school calendar",
    href: "/news",
  },
];

/** Label for the filter chip that clears the category filter. */
export const ALL_CATEGORIES = "All";

/**
 * The categories offered by the filter.
 *
 * Derived from the stories on the page rather than hard-coded, so the filter
 * can never offer a category that matches nothing - the mock's seven fixed
 * chips against six stories guaranteed dead filters. Order follows
 * `NEWS_CATEGORY_ORDER` so the chip row is stable as stories come and go.
 */
const NEWS_CATEGORY_ORDER: readonly NewsCategory[] = [
  "College News",
  "Academic",
  "Sports",
  "Events",
  "Announcements",
  "Achievements",
];

export const categoriesPresentIn = (
  stories: readonly NewsStory[]
): readonly NewsCategory[] => {
  const present = new Set(stories.map((story) => story.category));
  return NEWS_CATEGORY_ORDER.filter((category) => present.has(category));
};

/** How many stories one page of the archive holds before pagination appears. */
export const NEWS_PAGE_SIZE = 9;

export const NEWS_ARCHIVE_HEADING = "Latest Stories";
export const NEWS_FILTER_LABEL = "Filter stories by category";
export const NEWS_EMPTY_HEADING = "No stories published yet";
export const NEWS_EMPTY_BODY =
  "College news will appear here as it is published. In the meantime, the college office can be reached through the contact page.";
export const NEWS_FILTER_EMPTY_HEADING = "No stories in this category yet";
export const NEWS_FILTER_EMPTY_BODY =
  "Nothing has been published under this heading so far. Choose another category to see the rest of the archive.";

export const FEATURED_EYEBROW = "Featured";
export const FEATURED_READ_LABEL = "Read the story";

/**
 * A dated entry in the college calendar.
 *
 * `venue` and `time` are separate fields rather than the mock's single
 * "Venue • time" string so each can be omitted independently, and so the
 * separator is drawn by CSS instead of being baked into the content.
 */
export interface CollegeEvent {
  id: string;
  title: string;
  /** ISO date. Required - an event without a date cannot be listed. */
  date: string;
  venue?: string;
  time?: string;
  /** Omitted until a real details page exists for the event. */
  href?: string;
}

/**
 * Empty until the college publishes its calendar. The section renders its
 * empty state rather than three `[CMS]` placeholder rows.
 */
export const COLLEGE_EVENTS: readonly CollegeEvent[] = [];

export const EVENTS_EYEBROW = "Calendar";
export const EVENTS_HEADING = "Upcoming Events";
export const EVENTS_EMPTY_HEADING = "No events scheduled";
export const EVENTS_EMPTY_BODY =
  "Dates for upcoming fixtures, feast days and college functions will be listed here once the calendar is published.";

/**
 * Day and month for an event's date badge.
 *
 * Returns `null` for an unparseable date so the caller can drop the badge
 * instead of rendering "NaN", which is what a naive `getDate()` would produce.
 */
export const formatEventDate = (
  iso: string
): { day: string; month: string; label: string } | null => {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }
  return {
    day: parsed.toLocaleDateString("en-GB", { day: "numeric" }),
    month: parsed.toLocaleDateString("en-GB", { month: "short" }),
    label: parsed.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
  };
};

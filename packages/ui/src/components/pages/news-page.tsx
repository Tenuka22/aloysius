import * as stylex from "@stylexjs/stylex";

import type { NavItem } from "../../content/home";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Media } from "../primitives/media";
import type { ImageSource } from "../primitives/media";
import { SiteFooter } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";

const MAIN_ID = "main-content";
/** Module-level so the default is referentially stable across renders. */
const NO_STORIES: readonly NewsPageStory[] = [];

const styles = stylex.create({
  main: {
    display: "block",
    outline: {
      default: null,
      ":focus": "none",
    },
  },
  hero: {
    paddingBlockStart: space["3xl"],
    paddingBlockEnd: space.xl,
    paddingInline: space.md,
    backgroundColor: color.surface,
    textAlign: "center",
  },
  eyebrow: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWidest,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  heading: {
    margin: 0,
    marginBlockStart: space.sm,
    fontFamily: font.display,
    fontSize: font.size4xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    color: color.onSurface,
  },
  tagline: {
    margin: 0,
    marginBlockStart: space.sm,
    maxWidth: space.measure,
    marginInline: "auto",
    fontSize: font.sizeLg,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  heroMedia: {
    marginBlockStart: space.lg,
  },
  content: {
    paddingBlock: space.xl,
    paddingInline: space.md,
    maxWidth: space.measure,
    marginInline: "auto",
  },
  emptyBody: {
    margin: 0,
    fontSize: font.sizeSm,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  storyList: {
    display: "flex",
    flexDirection: "column",
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  storyItem: {
    paddingBlock: space.md,
    borderBottomWidth: space.px,
    borderBottomStyle: "solid",
    borderBottomColor: color.border,
  },
  storyCategory: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  storyTitle: {
    margin: 0,
    marginBlockStart: space["2xs"],
    fontFamily: font.display,
    fontSize: font.sizeLg,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    color: color.onSurface,
  },
  storySummary: {
    margin: 0,
    marginBlockStart: space.xs,
    maxWidth: space.measure,
    fontSize: font.sizeSm,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  storyDate: {
    margin: 0,
    marginBlockStart: space.xs,
    fontSize: font.sizeXs,
    color: color.onSurfaceMuted,
  },
});

export interface NewsPageProps {
  eyebrow?: string;
  heading?: string;
  tagline?: string;
  heroImage?: ImageSource;
  feedHeading?: string;
  feedCount?: never;
  /** Unused. It only printed "Showing N items per page" in placeholder text. */
  /** Published news posts from `cms.listNewsPosts`. */
  stories?: readonly NewsPageStory[];
  extraNavItems?: readonly NavItem[];
}

export interface NewsPageStory {
  id: string;
  title: string;
  summary: string | null;
  body: string;
  category: string | null;
  publishedAt: string | null;
  coverImageUrl: string | null;
}

export const NewsPage = ({
  eyebrow,
  heading = "News & Events",
  tagline,
  heroImage,
  feedHeading,
  stories = NO_STORIES,
  extraNavItems,
}: NewsPageProps) => (
  <>
    <SiteHeader activeHref="/news" extraNavItems={extraNavItems} />
    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      <section {...stylex.props(styles.hero)}>
        {eyebrow && <p {...stylex.props(styles.eyebrow)}>{eyebrow}</p>}
        <h1 {...stylex.props(styles.heading)}>{heading}</h1>
        {tagline && <p {...stylex.props(styles.tagline)}>{tagline}</p>}
        {heroImage && (
          <Media
            placeholder=""
            ratio="16:9"
            source={heroImage}
            style={styles.heroMedia}
          />
        )}
      </section>
      {/*
       * The archive. This rendered "News content will be displayed here once
       * published" unconditionally, regardless of how many published posts
       * existed - the route never passed them in, so the page had no way to
       * show them. It now lists the real posts, and says so plainly when there
       * are none rather than claiming content is pending.
       */}
      <section {...stylex.props(styles.content)}>
        {feedHeading && (
          <h2 {...stylex.props(styles.heading)}>{feedHeading}</h2>
        )}
        {stories.length === 0 ? (
          <p {...stylex.props(styles.emptyBody)}>
            There are no stories published yet. The latest from the College will
            appear here as soon as the office publishes it.
          </p>
        ) : (
          <ul {...stylex.props(styles.storyList)}>
            {stories.map((story) => (
              <li key={story.id} {...stylex.props(styles.storyItem)}>
                {story.category && (
                  <p {...stylex.props(styles.storyCategory)}>
                    {story.category}
                  </p>
                )}
                <h3 {...stylex.props(styles.storyTitle)}>{story.title}</h3>
                {story.summary && (
                  <p {...stylex.props(styles.storySummary)}>{story.summary}</p>
                )}
                {story.publishedAt && (
                  <p {...stylex.props(styles.storyDate)}>
                    {new Date(story.publishedAt).toLocaleDateString("en-LK", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
    <SiteFooter />
  </>
);

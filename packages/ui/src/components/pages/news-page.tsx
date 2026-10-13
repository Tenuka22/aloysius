import * as stylex from "@stylexjs/stylex";

import type { NavItem } from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Container, Section, SkipLink } from "../primitives/layout";
import { Media } from "../primitives/media";
import type { ImageSource } from "../primitives/media";
import { Reveal } from "../primitives/reveal";
import { SiteFooter } from "../site/site-footer";
import type { FooterContact } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";

/**
 * The public news archive.
 *
 * Reads as a newspaper's front page rather than a feed: the newest story leads
 * at full weight with its photograph, and the rest sit beneath in a grid. Every
 * story on this page is a real published `news_post` row - there is no
 * placeholder standing in for content the CMS does not hold.
 *
 * There is no `/news/:slug` route yet, so nothing here links through to a
 * story's own page. The cards are therefore not links at all: a card that looks
 * clickable and is not is worse than a card that plainly is not.
 */

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

  /* ---- the masthead ---- */
  header: {
    paddingBlock: space["2xl"],
    paddingInline: space.gutter,
    backgroundColor: color.surface,
  },
  title: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.size3xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    letterSpacing: font.trackingTight,
    color: color.onSurface,
    textWrap: "balance",
  },
  tagline: {
    margin: 0,
    marginBlockStart: space["2xs"],
    maxInlineSize: space.measure,
    fontSize: font.sizeLg,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },

  /* ---- the lead story ---- */
  heroMedia: {
    marginBlockStart: space.lg,
  },
  lead: {
    display: "grid",
    gap: space.lg,
    alignItems: "center",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.lg]: "minmax(0, 1.1fr) minmax(0, 1fr)",
    },
    columnGap: space["2xl"],
  },
  leadTitle: {
    margin: 0,
    maxInlineSize: "22ch",
    fontFamily: font.display,
    fontSize: font.size3xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    letterSpacing: font.trackingTight,
    color: color.onInverse,
    textWrap: "balance",
  },
  leadSummary: {
    margin: 0,
    marginBlockStart: space.md,
    maxInlineSize: "52ch",
    fontSize: font.sizeLg,
    lineHeight: font.leadingRelaxed,
    color: color.onInverseMuted,
    textWrap: "pretty",
  },
  leadMeta: {
    display: "flex",
    flexWrap: "wrap",
    columnGap: space["2xs"],
    rowGap: space["3xs"],
    margin: 0,
    marginBlockStart: space.lg,
    fontSize: font.sizeSm,
    color: color.onInverseSubtle,
  },

  /* ---- the rest of the archive ---- */
  archiveHeading: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.size2xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
    color: color.onSurface,
    textWrap: "balance",
  },
  grid: {
    display: "grid",
    gap: space.lg,
    margin: 0,
    marginBlockStart: space["2xl"],
    padding: 0,
    listStyle: "none",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.md]: "repeat(auto-fit, minmax(min(100%, 19rem), 1fr))",
    },
  },
  card: {
    display: "flex",
    flexDirection: "column",
    gap: space["3xs"],
    minInlineSize: 0,
    /*
     * A hairline rather than a card. Each story already carries its own
     * photograph, and boxing that as well would put two frames around one image.
     */
    borderBlockStartWidth: space.px,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: color.border,
    paddingBlockStart: space.md,
  },
  cardTitle: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.sizeXl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
    color: color.onSurface,
    textWrap: "pretty",
  },
  cardSummary: {
    margin: 0,
    fontSize: font.sizeSm,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  /*
   * The story's own photograph, above the text. It was passed in by the route
   * for the life of the page and never rendered once, which is why the archive
   * read as a wall of grey lines with no indication that these were illustrated
   * stories.
   */
  cardMedia: {
    marginBlockEnd: space.sm,
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    columnGap: space["2xs"],
    rowGap: space["3xs"],
    margin: 0,
    fontSize: font.sizeXs,
    letterSpacing: font.trackingWide,
    color: color.onSurfaceSubtle,
  },
  category: {
    color: color.accentOnSurface,
  },
  emptyBody: {
    margin: 0,
    maxInlineSize: space.measure,
    fontSize: font.sizeMd,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
});

export interface NewsPageProps {
  heading?: string;
  tagline?: string;
  heroImage?: ImageSource;
  feedHeading?: string;
  /** Published news posts from `cms.listNewsPosts`, newest first. */
  stories?: readonly NewsPageStory[];
  contact?: FooterContact;
  extraNavItems?: readonly NavItem[];
}

export interface NewsPageStory {
  id: string;
  title: string;
  summary: string | null;
  category: string | null;
  publishedAt: string | null;
  coverImageUrl: string | null;
}

/**
 * Pinned to `en-GB` and `UTC`. The route used `en-LK` with no zone, which left
 * the server and the visitor's browser free to disagree about both the month
 * name and - for a post published near midnight - the day, producing a
 * hydration mismatch on every date on the page.
 */
const formatDate = (value: string) =>
  new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

const StoryMeta = ({
  category,
  publishedAt,
  onInverse = false,
}: {
  category: string | null;
  publishedAt: string | null;
  onInverse?: boolean;
}) => (
  <p {...stylex.props(onInverse ? styles.leadMeta : styles.meta)}>
    {category ? <span>{category}</span> : null}
    {publishedAt ? (
      <time dateTime={publishedAt}>{formatDate(publishedAt)}</time>
    ) : null}
  </p>
);

/**
 * The newest story, at full weight on the deep-green band.
 *
 * It is the one story lifted out of the grid rather than duplicated in it: the
 * same headline appearing twice on one page reads as two stories.
 */
const LeadStory = ({ story }: { story: NewsPageStory }) => (
  <div {...stylex.props(styles.lead)}>
    <div>
      <h2 {...stylex.props(styles.leadTitle)}>{story.title}</h2>
      {story.summary ? (
        <p {...stylex.props(styles.leadSummary)}>{story.summary}</p>
      ) : null}
      <StoryMeta
        category={story.category}
        onInverse
        publishedAt={story.publishedAt}
      />
    </div>
    <Media
      placeholder={story.title}
      ratio="3:2"
      source={
        story.coverImageUrl ? { src: story.coverImageUrl, alt: "" } : undefined
      }
      zoom
    />
  </div>
);

export const NewsPage = ({
  heading = "News & Events",
  tagline,
  heroImage,
  feedHeading = "All stories",
  stories = NO_STORIES,
  contact,
  extraNavItems,
}: NewsPageProps) => {
  const [lead, ...rest] = stories;

  return (
    <>
      <SkipLink targetId={MAIN_ID} />
      <SiteHeader activeHref="/news" extraNavItems={extraNavItems} />
      <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
        <header {...stylex.props(styles.header)}>
          <Container>
            <h1 {...stylex.props(styles.title)}>{heading}</h1>
            {tagline ? (
              <p {...stylex.props(styles.tagline)}>{tagline}</p>
            ) : null}
            {heroImage ? (
              <Media
                placeholder=""
                ratio="16:9"
                source={heroImage}
                style={styles.heroMedia}
              />
            ) : null}
          </Container>
        </header>

        {stories.length === 0 ? (
          <Section tone="surface">
            <Container>
              <p {...stylex.props(styles.emptyBody)}>
                There are no stories published yet. The latest from the College
                will appear here as soon as the office publishes it.
              </p>
            </Container>
          </Section>
        ) : (
          <>
            <Section tone="inverse">
              <Container>
                {/*
                 * Guarded rather than assumed. The empty branch above already
                 * handles "no stories", but destructuring a `readonly T[]` gives
                 * `T | undefined` under `noUncheckedIndexedAccess`, and a lead
                 * that silently vanished would be far harder to notice than the
                 * one extra check.
                 */}
                {lead ? <LeadStory story={lead} /> : null}
              </Container>
            </Section>

            <Section tone="surface">
              <Container>
                <h2 {...stylex.props(styles.archiveHeading)}>{feedHeading}</h2>
                {rest.length === 0 ? (
                  <p {...stylex.props(styles.emptyBody)}>
                    That is the only story published so far.
                  </p>
                ) : (
                  <Reveal direction="up">
                    <ul {...stylex.props(styles.grid)}>
                      {rest.map((story) => (
                        <li key={story.id} {...stylex.props(styles.card)}>
                          {story.coverImageUrl ? (
                            <Media
                              placeholder={story.title}
                              ratio="3:2"
                              source={{ src: story.coverImageUrl, alt: "" }}
                              style={styles.cardMedia}
                              zoom
                            />
                          ) : null}
                          <h3 {...stylex.props(styles.cardTitle)}>
                            {story.title}
                          </h3>
                          {story.summary ? (
                            <p {...stylex.props(styles.cardSummary)}>
                              {story.summary}
                            </p>
                          ) : null}
                          <StoryMeta
                            category={story.category}
                            publishedAt={story.publishedAt}
                          />
                        </li>
                      ))}
                    </ul>
                  </Reveal>
                )}
              </Container>
            </Section>
          </>
        )}
      </main>
      <SiteFooter contact={contact} />
    </>
  );
};

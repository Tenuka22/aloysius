import * as stylex from "@stylexjs/stylex";

import { formatNewsDate } from "../../content/home";
import { FEATURED_EYEBROW, FEATURED_READ_LABEL } from "../../content/news";
import type { NewsStory } from "../../content/news";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, motionToken, space } from "../../tokens/tokens.stylex";
import { Container, Section, VisuallyHidden } from "../primitives/layout";
import { Media } from "../primitives/media";

const styles = stylex.create({
  /*
   * The mock's `1.5fr 1fr` with `align-items: end` has no media query, so below
   * ~900px the copy column is narrower than its own words. One column to
   * 64rem, then the two-column split - and `align-items: center` rather than
   * `end`, because `end` strands the copy against the bottom of a 460px image
   * as soon as the text is shorter than the photograph.
   */
  grid: {
    display: "grid",
    gap: space.xl,
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.xl]: "minmax(0, 1.5fr) minmax(0, 1fr)",
    },
    alignItems: {
      default: "start",
      [bp.xl]: "center",
    },
  },
  copy: {
    minWidth: 0,
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: space["2xs"],
    alignItems: "center",
    margin: 0,
    marginBlockEnd: space.sm,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
  },
  eyebrow: {
    color: color.accentOnSurface,
  },
  date: {
    color: color.onSurfaceSubtle,
    textTransform: "none",
    letterSpacing: font.trackingWide,
  },
  title: {
    margin: 0,
    fontFamily: font.display,
    fontWeight: font.weightSemibold,
    fontSize: font.size2xl,
    lineHeight: font.leadingSnug,
    letterSpacing: font.trackingTight,
    textWrap: "pretty",
  },
  /*
   * The whole card is one link, but only the headline carries the accessible
   * name - the image is decorative-by-duplication and the "Read the story"
   * affordance is a span inside the same anchor. That keeps one focus stop per
   * story instead of the mock's three overlapping targets.
   */
  link: {
    color: {
      default: color.onSurface,
      ":hover": color.accentOnSurface,
    },
    textDecoration: "none",
    transitionProperty: "color",
    transitionDuration: motionToken.fast,
  },
  excerpt: {
    margin: 0,
    marginBlockStart: space.md,
    maxWidth: space.measure,
    fontSize: font.sizeMd,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  readMore: {
    display: "inline-flex",
    alignItems: "center",
    gap: space["2xs"],
    minBlockSize: "2.75rem",
    marginBlockStart: space.lg,
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    borderBlockEndWidth: "2px",
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.accent,
    paddingBlockEnd: space["3xs"],
  },
  mediaLink: {
    display: "block",
    // A second link to the same place would be a duplicate focus stop, so the
    // image is hidden from assistive tech and excluded from the tab order.
    textDecoration: "none",
  },
});

/**
 * The lead story.
 *
 * Renders nothing when no story is featured - an empty two-column grid with a
 * placeholder photograph is worse than no section at all.
 */
export const FeaturedStory = ({ story }: { story?: NewsStory }) => {
  if (!story) {
    return null;
  }

  const formattedDate = formatNewsDate(story.date);

  return (
    <Section labelledBy="featured-story-title" tone="surface">
      <Container>
        <div {...stylex.props(styles.grid)}>
          <a
            aria-hidden="true"
            href={story.href}
            tabIndex={-1}
            {...stylex.props(styles.mediaLink)}
          >
            <Media
              placeholder="Featured story photograph"
              // The LCP element on this page: eager, high priority, and the
              // only image allowed to skip lazy loading.
              priority
              ratio="3:2"
              source={story.image}
              zoom
            />
          </a>

          <div {...stylex.props(styles.copy)}>
            <p {...stylex.props(styles.meta)}>
              <span {...stylex.props(styles.eyebrow)}>{FEATURED_EYEBROW}</span>
              {formattedDate ? (
                <time dateTime={story.date} {...stylex.props(styles.date)}>
                  {formattedDate}
                </time>
              ) : null}
            </p>

            <h2 id="featured-story-title" {...stylex.props(styles.title)}>
              <a href={story.href} {...stylex.props(styles.link)}>
                {story.title}
              </a>
            </h2>

            {story.excerpt ? (
              <p {...stylex.props(styles.excerpt)}>{story.excerpt}</p>
            ) : null}

            <a
              href={story.href}
              {...stylex.props(styles.link, styles.readMore)}
            >
              {FEATURED_READ_LABEL}
              {/* SC 2.4.4: "Read the story" alone is not a destination when
                  read out of context in a links list. */}
              <VisuallyHidden>: {story.title}</VisuallyHidden>
              <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
      </Container>
    </Section>
  );
};

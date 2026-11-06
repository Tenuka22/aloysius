import * as stylex from "@stylexjs/stylex";

import { formatNewsDate } from "../../content/home";
import { FEATURED_EYEBROW, FEATURED_READ_LABEL } from "../../content/news";
import type { NewsStory } from "../../content/news";
import { bp } from "../../tokens/breakpoints.stylex";
import { font } from "../../tokens/tokens.stylex";
import { DcInner, DcSection } from "../home/dc";
import { VisuallyHidden } from "../primitives/layout";
import { Media } from "../primitives/media";

/*
 * Measurements are the approved design's (News.dc.html): 90px section padding,
 * a 1.5fr / 1fr split with the copy aligned to the foot of a 460px photograph,
 * a 44px headline and a gold-underlined "Read the Story" link. One column
 * below 64rem, where the two-column split would starve the copy.
 */
const styles = stylex.create({
  section: {
    paddingBlock: "clamp(56px, 8vw, 90px)",
  },
  grid: {
    display: "grid",
    gap: "clamp(28px, 4vw, 56px)",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.xl]: "minmax(0, 1.5fr) minmax(0, 1fr)",
    },
    alignItems: {
      default: "start",
      [bp.xl]: "end",
    },
  },
  photo: {
    position: "relative",
    overflow: "hidden",
    width: "100%",
    height: "clamp(240px, 40vw, 460px)",
  },
  photoLink: {
    display: "block",
    textDecoration: "none",
  },
  copy: {
    minWidth: 0,
  },
  meta: {
    display: "flex",
    flexWrap: "wrap",
    gap: "14px",
    margin: 0,
    marginBlockEnd: "16px",
    fontSize: "11px",
    letterSpacing: "0.14em",
    fontWeight: 700,
    textTransform: "uppercase",
  },
  eyebrow: {
    color: "#A51919",
  },
  date: {
    color: "rgba(1, 52, 5, 0.45)",
  },
  title: {
    margin: 0,
    marginBlockEnd: "20px",
    fontFamily: font.display,
    fontWeight: 600,
    fontSize: "clamp(30px, 3.7vw, 44px)",
    lineHeight: 1.1,
    textWrap: "pretty",
  },
  /*
   * The whole card is one link, but only the headline carries the accessible
   * name - the "Read the Story" affordance is a second link to the same place,
   * labelled with the story's title for links lists.
   */
  link: {
    color: {
      default: "#013405",
      ":hover": "#A51919",
    },
    textDecoration: "none",
  },
  excerpt: {
    margin: 0,
    marginBlockEnd: "30px",
    fontSize: "15px",
    lineHeight: 1.7,
    color: "rgba(1, 52, 5, 0.75)",
    textWrap: "pretty",
  },
  readMore: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    paddingBlockEnd: "6px",
    borderBlockEndWidth: "2px",
    borderBlockEndStyle: "solid",
    borderBlockEndColor: "#FFB203",
    fontSize: "14px",
    fontWeight: 700,
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
  // Without a story page there is nothing to link to: the photograph and
  // headline render plainly and the "Read the Story" action is omitted.
  const linked = Boolean(story.href);
  const PhotoTag = linked ? "a" : "div";

  return (
    <DcSection
      labelledBy="featured-story-title"
      style={styles.section}
      tone="cream"
    >
      <DcInner>
        <div {...stylex.props(styles.grid)}>
          <PhotoTag
            {...(linked
              ? { "aria-hidden": true, href: story.href, tabIndex: -1 }
              : {})}
            {...stylex.props(styles.photoLink)}
          >
            <div {...stylex.props(styles.photo)}>
              <Media
                fill
                placeholder="Featured story photograph"
                // The LCP element on this page: eager, high priority, and the
                // only image allowed to skip lazy loading.
                priority
                source={story.image}
              />
            </div>
          </PhotoTag>

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
              {linked ? (
                <a href={story.href} {...stylex.props(styles.link)}>
                  {story.title}
                </a>
              ) : (
                story.title
              )}
            </h2>

            {story.excerpt ? (
              <p {...stylex.props(styles.excerpt)}>{story.excerpt}</p>
            ) : null}

            {linked ? (
              <a
                href={story.href}
                {...stylex.props(styles.link, styles.readMore)}
              >
                {FEATURED_READ_LABEL}
                {/* SC 2.4.4: "Read the Story" alone is not a destination when
                  read out of context in a links list. */}
                <VisuallyHidden>: {story.title}</VisuallyHidden>
                <span aria-hidden="true">&rarr;</span>
              </a>
            ) : null}
          </div>
        </div>
      </DcInner>
    </DcSection>
  );
};

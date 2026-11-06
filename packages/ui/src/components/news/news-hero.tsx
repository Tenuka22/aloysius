import * as stylex from "@stylexjs/stylex";

import {
  ALL_CATEGORIES,
  NEWS_CATEGORIES,
  NEWS_FILTER_LABEL,
  NEWS_HERO_TITLE,
} from "../../content/news";
import { font } from "../../tokens/tokens.stylex";

/*
 * Measurements are the approved design's (News.dc.html): 110px top and 70px
 * bottom padding, a 72px title, and the category chips inside the hero. There
 * is no intro paragraph and no crest watermark on this page. Fluid `clamp()`
 * only takes over below the design's desktop width.
 */
const styles = stylex.create({
  hero: {
    backgroundColor: "#013405",
    color: "#FFF8E7",
    paddingBlock: "clamp(64px, 9vw, 110px) clamp(44px, 6vw, 70px)",
    paddingInline: "clamp(20px, 5vw, 48px)",
  },
  inner: {
    width: "100%",
    maxWidth: "1180px",
    marginInline: "auto",
  },
  breadcrumb: {
    margin: 0,
    marginBlockEnd: "26px",
    fontSize: "12px",
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    color: "rgba(255, 248, 231, 0.6)",
  },
  breadcrumbLink: {
    color: {
      default: "rgba(255, 248, 231, 0.6)",
      ":hover": "#FFB203",
    },
    textDecoration: "none",
  },
  breadcrumbCurrent: {
    color: "#FFB203",
  },
  title: {
    margin: 0,
    fontFamily: font.display,
    fontWeight: 600,
    fontSize: "clamp(40px, 6vw, 72px)",
    lineHeight: 1.02,
  },
  /*
   * Real buttons in a labelled fieldset, wrapping rather than overflowing. The
   * fieldset's UA border, padding and `min-inline-size: min-content` are reset
   * so seven chips cannot push a 320px viewport wider.
   */
  filter: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
    margin: 0,
    marginBlockStart: "44px",
    padding: 0,
    borderWidth: 0,
    minInlineSize: 0,
  },
  legend: {
    position: "absolute",
    inlineSize: "1px",
    blockSize: "1px",
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    padding: 0,
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    paddingBlock: "9px",
    paddingInline: "18px",
    borderWidth: "1px",
    borderStyle: "solid",
    fontFamily: font.body,
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    cursor: "pointer",
    touchAction: "manipulation",
  },
  chipIdle: {
    backgroundColor: {
      default: "transparent",
      ":hover": "rgba(255, 178, 3, 0.14)",
    },
    borderColor: "rgba(255, 178, 3, 0.4)",
    color: "#FFB203",
  },
  chipActive: {
    backgroundColor: "#FFB203",
    borderColor: "#FFB203",
    color: "#013405",
  },
});

export const NewsHero = ({
  title = NEWS_HERO_TITLE,
  filter = ALL_CATEGORIES,
  onFilterChange,
}: {
  title?: string;
  filter?: string;
  onFilterChange?: (category: string) => void;
}) => (
  <section aria-labelledby="news-hero-title" {...stylex.props(styles.hero)}>
    <div {...stylex.props(styles.inner)}>
      <nav aria-label="Breadcrumb">
        <p {...stylex.props(styles.breadcrumb)}>
          <a href="/" {...stylex.props(styles.breadcrumbLink)}>
            Home
          </a>{" "}
          &nbsp;/&nbsp;{" "}
          <span {...stylex.props(styles.breadcrumbCurrent)}>
            News &amp; Events
          </span>
        </p>
      </nav>
      <h1 id="news-hero-title" {...stylex.props(styles.title)}>
        {title}
      </h1>
      {onFilterChange ? (
        <fieldset {...stylex.props(styles.filter)}>
          <legend {...stylex.props(styles.legend)}>{NEWS_FILTER_LABEL}</legend>
          {[ALL_CATEGORIES, ...NEWS_CATEGORIES].map((category) => {
            const active = category === filter;
            return (
              <button
                // `aria-pressed` rather than a tab list: these are toggles
                // over one region, not separate panels.
                aria-pressed={active}
                key={category}
                onClick={() => onFilterChange(category)}
                type="button"
                {...stylex.props(
                  styles.chip,
                  active ? styles.chipActive : styles.chipIdle
                )}
              >
                {category}
              </button>
            );
          })}
        </fieldset>
      ) : null}
    </div>
  </section>
);

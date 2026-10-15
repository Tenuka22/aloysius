import * as stylex from "@stylexjs/stylex";

import {
  ALL_CATEGORIES,
  NEWS_FILTER_LABEL,
  NEWS_HERO_INTRO,
  NEWS_HERO_TITLE,
} from "../../content/news";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, motionToken, space } from "../../tokens/tokens.stylex";
import { Container } from "../primitives/layout";

/** Module-level so the default prop is referentially stable across renders. */
const NO_CATEGORIES: readonly string[] = [];

const styles = stylex.create({
  /*
   * The wayfinding header used by Academics and Students, not the About page's
   * near-full-viewport panel. The mock's fixed `110px 48px 70px` becomes the
   * fluid `3xl`/`gutter` steps, which compress to 3.5rem and 1.25rem on a
   * 320px phone.
   *
   * The mock puts its category filter inside this hero. It lives with the
   * archive it controls instead: a control that changes a grid two sections
   * further down is a WCAG 2.2 SC 3.2.2 problem, and on a phone the filtered
   * result would be entirely off-screen when the chip is pressed.
   */
  hero: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
    paddingBlock: space["3xl"],
    paddingInline: space.gutter,
  },
  watermark: {
    position: "absolute",
    insetInlineEnd: "-5.5rem",
    insetBlockStart: "-3.5rem",
    height: "30rem",
    width: "auto",
    opacity: 0.07,
    pointerEvents: "none",
    // Below 40rem the crest would sit behind the title rather than in the
    // margin, so it is simply not painted.
    display: {
      default: "none",
      [bp.md]: "block",
    },
  },
  content: {
    position: "relative",
  },
  breadcrumb: {
    margin: 0,
    marginBlockEnd: space.md,
    fontSize: font.sizeXs,
    fontWeight: font.weightSemibold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onInverseSubtle,
  },
  breadcrumbLink: {
    display: "inline-flex",
    alignItems: "center",
    // SC 2.5.8: the mock's bare inline link is a ~15px target.
    minBlockSize: {
      default: "1.5rem",
      [bp.touch]: "2.75rem",
    },
    color: {
      default: color.onInverseSubtle,
      ":hover": color.accentOnInverse,
    },
    textDecoration: "none",
  },
  breadcrumbCurrent: {
    color: color.accentOnInverse,
  },
  title: {
    margin: 0,
    maxWidth: "14ch",
    fontFamily: font.display,
    fontWeight: font.weightSemibold,
    fontSize: font.size4xl,
    lineHeight: font.leadingTight,
    letterSpacing: font.trackingTight,
    textWrap: "balance",
  },
  /*
   * The category chips live in the hero, as in the design. They are real
   * buttons in a labelled fieldset, and the row wraps rather than overflowing;
   * the fieldset's UA border, padding and `min-inline-size: min-content` are
   * reset so seven chips cannot push a 320px viewport wider.
   */
  filter: {
    display: "flex",
    flexWrap: "wrap",
    gap: space["2xs"],
    margin: 0,
    marginBlockStart: space.xl,
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
    minBlockSize: "2.75rem",
    paddingBlock: space["2xs"],
    paddingInline: space.md,
    borderWidth: space.px,
    borderStyle: "solid",
    fontFamily: font.body,
    fontSize: font.sizeXs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    cursor: "pointer",
    touchAction: "manipulation",
    transitionProperty: "background-color, color, border-color",
    transitionDuration: motionToken.fast,
  },
  chipIdle: {
    backgroundColor: {
      default: "transparent",
      ":hover": "rgba(255, 178, 3, 0.14)",
    },
    borderColor: color.borderAccent,
    color: color.accentOnInverse,
  },
  chipActive: {
    backgroundColor: color.accent,
    borderColor: color.accent,
    color: color.onAccent,
  },
  intro: {
    margin: 0,
    marginBlockStart: space.md,
    maxWidth: space.measure,
    fontSize: font.sizeLg,
    lineHeight: font.leadingRelaxed,
    color: color.onInverseMuted,
    textWrap: "pretty",
  },
});

export const NewsHero = ({
  title = NEWS_HERO_TITLE,
  intro = NEWS_HERO_INTRO,
  crestSrc = "/logo.png",
  categories = NO_CATEGORIES,
  filter = ALL_CATEGORIES,
  onFilterChange,
}: {
  title?: string;
  intro?: string;
  crestSrc?: string;
  /** Categories present in the archive; the "All" chip is added here. */
  categories?: readonly string[];
  filter?: string;
  onFilterChange?: (category: string) => void;
}) => (
  <section aria-labelledby="news-hero-title" {...stylex.props(styles.hero)}>
    <img
      alt=""
      aria-hidden="true"
      decoding="async"
      loading="lazy"
      src={crestSrc}
      {...stylex.props(styles.watermark)}
    />
    <Container>
      <div {...stylex.props(styles.content)}>
        <nav aria-label="Breadcrumb">
          <p {...stylex.props(styles.breadcrumb)}>
            <a href="/" {...stylex.props(styles.breadcrumbLink)}>
              Home
            </a>{" "}
            /{" "}
            <span {...stylex.props(styles.breadcrumbCurrent)}>
              News &amp; Events
            </span>
          </p>
        </nav>
        <h1 id="news-hero-title" {...stylex.props(styles.title)}>
          {title}
        </h1>
        <p {...stylex.props(styles.intro)}>{intro}</p>
        {categories.length > 0 && onFilterChange ? (
          <fieldset {...stylex.props(styles.filter)}>
            <legend {...stylex.props(styles.legend)}>
              {NEWS_FILTER_LABEL}
            </legend>
            {[ALL_CATEGORIES, ...categories].map((category) => {
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
    </Container>
  </section>
);

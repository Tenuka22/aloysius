import * as stylex from "@stylexjs/stylex";

import { NEWS_HERO_INTRO, NEWS_HERO_TITLE } from "../../content/news";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Container } from "../primitives/layout";

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
}: {
  title?: string;
  intro?: string;
  crestSrc?: string;
}) => (
  <section aria-labelledby="news-hero-title" {...stylex.props(styles.hero)}>
    <img
      alt=""
      aria-hidden="true"
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
      </div>
    </Container>
  </section>
);

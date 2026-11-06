import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";

import { bp } from "../../tokens/breakpoints.stylex";
import { font } from "../../tokens/tokens.stylex";

/*
 * The inner-page hero, to the approved UI/UX design (the Academics and
 * Students pages share it): 130/110px section padding, a 76px title, a 17px
 * intro, a breadcrumb and the crest watermark. Fluid `clamp()` only takes over
 * below the design's desktop width so a phone does not inherit a 76px headline.
 */
const styles = stylex.create({
  hero: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#013405",
    color: "#FFF8E7",
    paddingBlock: "clamp(72px, 11vw, 130px) clamp(60px, 9vw, 110px)",
    paddingInline: "clamp(20px, 5vw, 48px)",
  },
  heroCompact: {
    paddingBlock: "clamp(64px, 9vw, 110px) clamp(44px, 6vw, 70px)",
  },
  watermark: {
    position: "absolute",
    insetInlineEnd: "-90px",
    insetBlockStart: "-60px",
    height: "480px",
    width: "auto",
    opacity: 0.07,
    pointerEvents: "none",
    display: {
      default: "none",
      [bp.md]: "block",
    },
  },
  inner: {
    position: "relative",
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
    marginBlockEnd: "24px",
    maxWidth: "14ch",
    fontFamily: font.display,
    fontWeight: 600,
    fontSize: "clamp(44px, 6.5vw, 76px)",
    lineHeight: 1.02,
  },
  titleWide: {
    maxWidth: "none",
  },
  titleCompact: {
    marginBlockEnd: 0,
    maxWidth: "none",
    fontSize: "clamp(40px, 6vw, 72px)",
  },
  intro: {
    margin: 0,
    maxWidth: "56ch",
    fontSize: "17px",
    lineHeight: 1.7,
    color: "rgba(255, 248, 231, 0.75)",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    marginBlockStart: "44px",
  },
});

export const PageHero = ({
  crumb,
  title,
  intro,
  titleId,
  titleWide = false,
  compact = false,
  actions,
  crestSrc = "/logo.png",
}: {
  /** The current page's name in the breadcrumb, e.g. "Academics". */
  crumb: string;
  /** A node so a page can break its title across lines. */
  title: ReactNode;
  /** Omitted on a page whose design has no intro line. */
  intro?: string;
  titleId: string;
  /** Lets the title run the full width instead of wrapping at 14 characters. */
  titleWide?: boolean;
  /** The shorter masthead (110px / 70px) used by pages with no intro line. */
  compact?: boolean;
  /** Buttons set under the intro. */
  actions?: ReactNode;
  crestSrc?: string;
}) => (
  <section
    aria-labelledby={titleId}
    {...stylex.props(styles.hero, compact && styles.heroCompact)}
  >
    <img
      alt=""
      aria-hidden="true"
      decoding="async"
      loading="lazy"
      src={crestSrc}
      {...stylex.props(styles.watermark)}
    />
    <div {...stylex.props(styles.inner)}>
      <p {...stylex.props(styles.breadcrumb)}>
        <a href="/" {...stylex.props(styles.breadcrumbLink)}>
          Home
        </a>{" "}
        &nbsp;/&nbsp;{" "}
        <span {...stylex.props(styles.breadcrumbCurrent)}>{crumb}</span>
      </p>
      <h1
        id={titleId}
        {...stylex.props(
          styles.title,
          titleWide && styles.titleWide,
          compact && styles.titleCompact
        )}
      >
        {title}
      </h1>
      {intro ? <p {...stylex.props(styles.intro)}>{intro}</p> : null}
      {actions ? <div {...stylex.props(styles.actions)}>{actions}</div> : null}
    </div>
  </section>
);

import * as stylex from "@stylexjs/stylex";

import {
  ABOUT_HERO_INTRO,
  ABOUT_HERO_TITLE,
  ABOUT_JUMP_LINKS,
} from "../../content/about";
import { bp } from "../../tokens/breakpoints.stylex";
import { font } from "../../tokens/tokens.stylex";

/*
 * Measurements are the approved design's (About.dc.html), not the site-wide
 * fluid tokens: 130/110px section padding, 76px title, 17px intro, 13px jump
 * links with a 28px gap. Fluid `clamp()` only takes over below the design's
 * desktop width so a phone does not inherit a 76px headline.
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
    maxWidth: "12ch",
    fontFamily: font.display,
    fontWeight: 600,
    fontSize: "clamp(44px, 6.5vw, 76px)",
    lineHeight: 1.02,
  },
  intro: {
    margin: 0,
    maxWidth: "56ch",
    fontSize: "17px",
    lineHeight: 1.7,
    color: "rgba(255, 248, 231, 0.75)",
  },
  jumpLinks: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px 28px",
    marginBlockStart: "44px",
    marginBlockEnd: 0,
    marginInline: 0,
    padding: 0,
    listStyle: "none",
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
  },
  jumpLink: {
    display: "inline-block",
    paddingBlockEnd: "6px",
    borderBlockEndWidth: "2px",
    borderBlockEndStyle: "solid",
    borderBlockEndColor: "transparent",
    color: {
      default: "rgba(255, 248, 231, 0.8)",
      ":hover": "#FFB203",
    },
    textDecoration: "none",
  },
  jumpLinkFirst: {
    borderBlockEndColor: "#FFB203",
    color: "#FFB203",
  },
  jumpLinkBright: {
    color: {
      default: "#FFF8E7",
      ":hover": "#FFB203",
    },
  },
});

/** The first three links are set in full cream, the rest at 80% - as designed. */
const BRIGHT_LINK_COUNT = 3;

export interface AboutHeroProps {
  title?: string;
  intro?: string;
  crestSrc?: string;
  jumpLinks?: typeof ABOUT_JUMP_LINKS;
}

export const AboutHero = ({
  title = ABOUT_HERO_TITLE,
  intro = ABOUT_HERO_INTRO,
  crestSrc = "/logo.png",
  jumpLinks = ABOUT_JUMP_LINKS,
}: AboutHeroProps) => (
  <section aria-labelledby="about-hero-title" {...stylex.props(styles.hero)}>
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
        <span {...stylex.props(styles.breadcrumbCurrent)}>About</span>
      </p>
      <h1 id="about-hero-title" {...stylex.props(styles.title)}>
        {title}
      </h1>
      <p {...stylex.props(styles.intro)}>{intro}</p>
      <nav aria-label="On this page">
        <ul {...stylex.props(styles.jumpLinks)}>
          {jumpLinks.map((link, index) => (
            <li key={link.href}>
              <a
                href={link.href}
                {...stylex.props(
                  styles.jumpLink,
                  index > 0 &&
                    index < BRIGHT_LINK_COUNT &&
                    styles.jumpLinkBright,
                  index === 0 && styles.jumpLinkFirst
                )}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  </section>
);

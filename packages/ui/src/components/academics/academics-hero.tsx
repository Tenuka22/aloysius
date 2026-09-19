import * as stylex from "@stylexjs/stylex";

import type { JumpLink } from "../../content/about";
import {
  ACADEMICS_HERO_INTRO,
  ACADEMICS_HERO_TITLE,
  ACADEMICS_JUMP_LINKS,
} from "../../content/academics";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Container } from "../primitives/layout";

const styles = stylex.create({
  /*
   * Deliberately shorter than the About hero. That one opens a story and earns
   * a near-full-viewport panel; this is a wayfinding header for a reference
   * page, so the first real section stays visible above the fold on a laptop.
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
    // Below 40rem the crest would sit behind the title itself rather than in
    // the margin, so it is simply not painted.
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
  jumpLinks: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.md,
    // Once each chip is a 44px target the rows need their own breathing room.
    rowGap: {
      default: null,
      [bp.touch]: space["2xs"],
    },
    marginBlockStart: space.xl,
    padding: 0,
    listStyle: "none",
  },
  jumpLink: {
    /*
     * WCAG 2.2 SC 2.5.8 (Target Size, Minimum). A bare underlined label is a
     * ~20px tall target; centring it in a 24px box clears AA on any pointer,
     * and coarse pointers get the full 44px comfort target.
     */
    display: "inline-flex",
    alignItems: "center",
    minBlockSize: {
      default: "1.5rem",
      [bp.touch]: "2.75rem",
    },
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    color: {
      default: color.onInverseMuted,
      ":hover": color.accentOnInverse,
    },
    textDecoration: "none",
    // A permanently-present transparent border, so hovering can never change
    // the box and shift the chips beside it.
    borderBlockEndWidth: "2px",
    borderBlockEndStyle: "solid",
    borderBlockEndColor: "transparent",
    paddingBlockEnd: space["3xs"],
  },
  jumpLinkFirst: {
    color: color.accentOnInverse,
    borderBlockEndColor: color.accent,
  },
});

export const AcademicsHero = ({
  title = ACADEMICS_HERO_TITLE,
  intro = ACADEMICS_HERO_INTRO,
  crestSrc = "/logo.png",
  jumpLinks = ACADEMICS_JUMP_LINKS,
}: {
  title?: string;
  intro?: string;
  crestSrc?: string;
  jumpLinks?: readonly JumpLink[];
}) => (
  <section
    aria-labelledby="academics-hero-title"
    {...stylex.props(styles.hero)}
  >
    <img
      alt=""
      aria-hidden="true"
      src={crestSrc}
      {...stylex.props(styles.watermark)}
    />
    <Container>
      <div {...stylex.props(styles.content)}>
        <p {...stylex.props(styles.breadcrumb)}>
          <a href="/" {...stylex.props(styles.breadcrumbLink)}>
            Home
          </a>{" "}
          / <span {...stylex.props(styles.breadcrumbCurrent)}>Academics</span>
        </p>
        <h1 id="academics-hero-title" {...stylex.props(styles.title)}>
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
    </Container>
  </section>
);

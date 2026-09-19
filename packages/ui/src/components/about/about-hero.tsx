import * as stylex from "@stylexjs/stylex";

import {
  ABOUT_HERO_INTRO,
  ABOUT_HERO_TITLE,
  ABOUT_JUMP_LINKS,
} from "../../content/about";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Container } from "../primitives/layout";

const styles = stylex.create({
  hero: {
    position: "relative",
    overflow: "hidden",
    display: "grid",
    placeItems: "center",
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
    paddingBlock: space["3xl"],
    paddingInline: space.gutter,
    minBlockSize: {
      default: "min(100svh - var(--header-height, 4rem), 46rem)",
      [bp.short]: "auto",
    },
  },
  watermark: {
    position: "absolute",
    insetInlineEnd: "-5.5rem",
    insetBlockStart: "-3.5rem",
    height: "30rem",
    width: "auto",
    opacity: 0.07,
    pointerEvents: "none",
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
    maxWidth: "12ch",
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
    // Coarse-pointer rows need vertical breathing room once each chip is 44px.
    rowGap: {
      default: null,
      [bp.touch]: space["2xs"],
    },
    flexWrap: "wrap",
    gap: space.md,
    marginBlockStart: space.xl,
    padding: 0,
    listStyle: "none",
  },
  jumpLink: {
    /*
     * WCAG 2.2 SC 2.5.8 (Target Size, Minimum): the underlined label alone was
     * a ~20px tall target. Flex centring inside a 24px box satisfies AA on any
     * pointer; coarse pointers get the full 44px comfort target.
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

export const AboutHero = ({
  title = ABOUT_HERO_TITLE,
  intro = ABOUT_HERO_INTRO,
  crestSrc = "/logo.png",
  jumpLinks = ABOUT_JUMP_LINKS,
}: {
  title?: string;
  intro?: string;
  crestSrc?: string;
  jumpLinks?: typeof ABOUT_JUMP_LINKS;
}) => (
  <section aria-labelledby="about-hero-title" {...stylex.props(styles.hero)}>
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
          / <span {...stylex.props(styles.breadcrumbCurrent)}>About</span>
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

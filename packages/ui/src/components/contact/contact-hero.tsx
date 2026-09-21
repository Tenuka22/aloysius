import * as stylex from "@stylexjs/stylex";

import { CONTACT_HERO_INTRO, CONTACT_HERO_TITLE } from "../../content/contact";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Container } from "../primitives/layout";

const styles = stylex.create({
  /*
   * The shortest hero on the site. Contact is a task page - the address and the
   * form are what the visitor came for, so the panel above them stays out of
   * the way and both are reachable without scrolling on a 1366x768 laptop.
   */
  hero: {
    position: "relative",
    overflow: "hidden",
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
    paddingBlock: space["2xl"],
    paddingInline: space.gutter,
  },
  watermark: {
    position: "absolute",
    insetInlineEnd: "-5.5rem",
    insetBlockStart: "-3.5rem",
    height: "26rem",
    width: "auto",
    opacity: 0.07,
    pointerEvents: "none",
    // Below 40rem the crest would sit behind the title rather than beside it.
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
    // A 12px uppercase label is a ~16px tall target on its own; the inline-flex
    // box centres it in 24px so it clears WCAG 2.2 SC 2.5.8 on any pointer.
    display: "inline-flex",
    alignItems: "center",
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
    maxWidth: "16ch",
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

export const ContactHero = ({
  title = CONTACT_HERO_TITLE,
  intro = CONTACT_HERO_INTRO,
  crestSrc = "/logo.png",
}: {
  title?: string;
  intro?: string;
  crestSrc?: string;
}) => (
  <section aria-labelledby="contact-hero-title" {...stylex.props(styles.hero)}>
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
            / <span {...stylex.props(styles.breadcrumbCurrent)}>Contact</span>
          </p>
        </nav>
        <h1 id="contact-hero-title" {...stylex.props(styles.title)}>
          {title}
        </h1>
        <p {...stylex.props(styles.intro)}>{intro}</p>
      </div>
    </Container>
  </section>
);

import * as stylex from "@stylexjs/stylex";

import {
  ADMISSIONS_URL,
  COLLEGE_LOCATION,
  COLLEGE_NAME,
  MOTTO,
} from "../../content/home";
import type { HeroBackground } from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { ButtonLink } from "../primitives/button";
import { Media } from "../primitives/media";

const styles = stylex.create({
  hero: {
    position: "relative",
    display: "grid",
    placeItems: "center",
    overflow: "hidden",
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
    paddingBlock: space["3xl"],
    paddingInline: space.gutter,
    /*
     * `svh` not `vh`: on iOS and Android the URL bar collapses on scroll, and
     * `vh` makes the hero jump by ~60px at that moment. `min()` against a rem
     * cap stops the hero from becoming a 1500px wall on a 4K monitor, and the
     * landscape-phone case drops the height requirement entirely.
     *
     * The sticky header sits above the hero and eats into the same viewport, so
     * it is subtracted here. Without that, `92svh` plus a 4rem header is taller
     * than the screen and the CTA row falls below the fold on exactly the small
     * phones that need it most.
     */
    minBlockSize: {
      default: "min(92svh - var(--header-height, 4rem), 46rem)",
      [bp.short]: "auto",
    },
  },
  background: {
    position: "absolute",
    inset: 0,
  },
  scrim: {
    position: "absolute",
    inset: 0,
    // Two stops, weighted to the bottom, so the CTA row keeps contrast over a
    // bright photograph.
    backgroundImage: `linear-gradient(180deg, ${color.surfaceOverlay} 0%, rgba(1, 52, 5, 0.72) 55%, rgba(1, 52, 5, 0.94) 100%)`,
    pointerEvents: "none",
  },
  watermark: {
    position: "absolute",
    insetInlineEnd: "-7.5rem",
    insetBlockEnd: "-10rem",
    height: "40rem",
    width: "auto",
    opacity: 0.07,
    pointerEvents: "none",
    // Pure decoration - not worth the decode cost on a phone.
    display: {
      default: "none",
      [bp.xl]: "block",
    },
  },
  content: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    width: "100%",
    maxWidth: space.content,
  },
  motto: {
    margin: 0,
    marginBlockEnd: space.md,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingUltra,
    textTransform: "uppercase",
    color: color.accentOnInverse,
  },
  title: {
    margin: 0,
    fontFamily: font.display,
    fontWeight: font.weightSemibold,
    fontSize: font.size4xl,
    lineHeight: font.leadingTight,
    letterSpacing: font.trackingTight,
    textWrap: "balance",
  },
  place: {
    margin: 0,
    marginBlockStart: space.xs,
    fontSize: font.sizeXs,
    fontWeight: font.weightSemibold,
    letterSpacing: font.trackingUltra,
    textTransform: "uppercase",
    color: color.onInverseMuted,
  },
  rule: {
    width: "3.5rem",
    height: "2px",
    marginBlock: space.lg,
    backgroundColor: color.accent,
    border: 0,
  },
  tagline: {
    margin: 0,
    maxWidth: "30ch",
    fontFamily: font.display,
    fontStyle: "italic",
    fontSize: font.sizeXl,
    lineHeight: font.leadingSnug,
    color: color.onInverse,
    textWrap: "balance",
  },
  actions: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: space.sm,
    width: "100%",
    marginBlockStart: space.xl,
  },
  action: {
    // Full-width stacked buttons on a 320px phone, side by side from 26.75rem.
    flex: {
      default: "1 1 100%",
      [bp.sm]: "0 1 auto",
    },
  },
});

export const Hero = ({
  tagline = "Tradition. Excellence. Leadership.",
  background,
  crestSrc = "/logo.png",
  exploreHref = "/about",
  admissionsHref = ADMISSIONS_URL,
  motto = MOTTO,
  place = COLLEGE_LOCATION,
  title = COLLEGE_NAME,
  cta1 = "Explore the College",
  cta2 = "Admissions",
}: {
  tagline?: string;
  background?: HeroBackground;
  crestSrc?: string;
  exploreHref?: string;
  admissionsHref?: string;
  motto?: string;
  place?: string;
  title?: string;
  cta1?: string;
  cta2?: string;
}) => {
  const renderBackground = () => {
    if (background?.kind === "video") {
      return (
        <video
          aria-hidden="true"
          autoPlay
          loop
          muted
          playsInline
          src={background.value}
          {...stylex.props(styles.background)}
        />
      );
    }
    if (background?.kind === "color") {
      return (
        <div
          aria-hidden="true"
          style={{ backgroundColor: background.value }}
          {...stylex.props(styles.background)}
        />
      );
    }
    return (
      <Media
        fill
        placeholder=""
        priority
        source={
          background?.kind === "image"
            ? { alt: "", src: background.value }
            : undefined
        }
        style={styles.background}
      />
    );
  };

  return (
    <section aria-labelledby="hero-title" {...stylex.props(styles.hero)}>
      {renderBackground()}
      <div {...stylex.props(styles.scrim)} />
      <img
        alt=""
        aria-hidden="true"
        src={crestSrc}
        {...stylex.props(styles.watermark)}
      />

      <div {...stylex.props(styles.content)}>
        <p {...stylex.props(styles.motto)}>{motto}</p>
        <h1 id="hero-title" {...stylex.props(styles.title)}>
          {title}
        </h1>
        <p {...stylex.props(styles.place)}>{place}</p>
        <hr {...stylex.props(styles.rule)} />
        <p {...stylex.props(styles.tagline)}>{tagline}</p>
        <div {...stylex.props(styles.actions)}>
          <ButtonLink href={exploreHref} style={styles.action} variant="solid">
            {cta1}
          </ButtonLink>
          <ButtonLink
            href={admissionsHref}
            style={styles.action}
            variant="outlineInverse"
          >
            {cta2}
          </ButtonLink>
        </div>
      </div>
    </section>
  );
};

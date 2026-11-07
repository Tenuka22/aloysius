import * as stylex from "@stylexjs/stylex";

import { COLLEGE_LOCATION, COLLEGE_NAME, MOTTO } from "../../content/home";
import type { HeroBackground } from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Media } from "../primitives/media";

/** Id of the element directly after the hero; the scroll cue targets it. */
export const HERO_NEXT_SECTION_ID = "home-intro";

const scrollToNextSection = (): void => {
  const target = document.querySelector(`#${HERO_NEXT_SECTION_ID}`);
  if (!target) {
    return;
  }
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;
  target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
};

const styles = stylex.create({
  hero: {
    position: "relative",
    display: "grid",
    // Text sits in the lower-left corner, lined up with the header's brand.
    placeItems: "end center",
    overflow: "hidden",
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
    paddingBlock: space["3xl"],
    // Clear the floating header, which sits on top of the hero.
    paddingBlockStart: `calc(${space["3xl"]} + var(--header-height, 4rem))`,
    paddingInline: space.gutter,
    /*
     * `svh` not `vh`: on iOS and Android the URL bar collapses on scroll, and
     * `vh` makes the hero jump by ~60px at that moment. The header floats over
     * the top of the hero, so the hero alone fills the first screen with no
     * sliver of the next section below it. The landscape-phone case drops the
     * height requirement entirely.
     */
    minBlockSize: {
      default: "100svh",
      [bp.short]: "auto",
    },
  },
  background: {
    position: "absolute",
    inset: 0,
    // A <video> keeps its own aspect ratio unless told otherwise, which on a
    // portrait phone left it as a strip across the top of the hero.
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  scrim: {
    position: "absolute",
    inset: 0,
    // A light, even black wash - just enough for the white text to read over a
    // bright photograph or video without hiding it.
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    pointerEvents: "none",
  },
  content: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    textAlign: "start",
    width: "100%",
    maxWidth: space.contentWide,
  },
  title: {
    margin: 0,
    fontFamily: font.display,
    fontWeight: font.weightBold,
    fontSize: "clamp(2rem, 0.5rem + 8.4vw, 7.5rem)",
    lineHeight: font.leadingTight,
    letterSpacing: font.trackingTight,
    textTransform: "uppercase",
    textWrap: "balance",
    textShadow: "0 1px 2px rgba(0, 0, 0, 0.6)",
  },
  place: {
    margin: 0,
    marginBlockStart: space.sm,
    fontSize: {
      default: font.sizeSm,
      [bp.sm]: font.sizeLg,
    },
    fontWeight: font.weightExtrabold,
    letterSpacing: {
      default: "0.2em",
      [bp.sm]: font.trackingUltra,
    },
    textTransform: "uppercase",
    color: color.onInverse,
    textShadow: "0 1px 2px rgba(0, 0, 0, 0.6)",
  },
  rule: {
    width: "3.5rem",
    height: "2px",
    marginBlock: space.lg,
    marginInline: 0,
    backgroundColor: color.accent,
    border: 0,
  },
  tagline: {
    margin: 0,
    maxWidth: "36ch",
    fontFamily: font.display,
    fontStyle: "italic",
    fontWeight: font.weightBold,
    fontSize: font.size2xl,
    lineHeight: font.leadingSnug,
    color: color.onInverse,
    textWrap: "balance",
    textShadow: "0 1px 2px rgba(0, 0, 0, 0.6)",
  },
  scrollCue: {
    position: "absolute",
    insetBlockEnd: space.lg,
    insetInlineStart: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "2.75rem",
    height: "2.75rem",
    borderRadius: "50%",
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.accentOnInverse,
    color: color.accentOnInverse,
    backgroundColor: "transparent",
    cursor: "pointer",
    zIndex: 1,
  },
});

/**
 * The bullet in "Galle • Sri Lanka" was saved through a Latin-1/UTF-8 mix-up and
 * arrives as `Ã¢â‚¬Â¢` (or the single-decode `â€¢`). Repair it on the way out so the
 * stored text does not have to be re-entered by hand.
 */
const MOJIBAKE_BULLET = /Ã¢â‚¬Â¢|â€¢/gu;
const repairText = (value: string): string =>
  value.replaceAll(MOJIBAKE_BULLET, "•");

export const Hero = ({
  background,
  motto = MOTTO,
  place = COLLEGE_LOCATION,
  title = COLLEGE_NAME,
}: {
  background?: HeroBackground;
  motto?: string;
  place?: string;
  title?: string;
}) => {
  // Two-line lockup as in the design: the last word drops to its own line.
  const splitAt = title.lastIndexOf(" ");
  const titleHead = splitAt > 0 ? title.slice(0, splitAt) : title;
  const titleTail = splitAt > 0 ? title.slice(splitAt + 1) : "";
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
      <div aria-hidden="true" {...stylex.props(styles.scrim)} />

      <div {...stylex.props(styles.content)}>
        <h1 id="hero-title" {...stylex.props(styles.title)}>
          {titleHead}
          {titleTail ? (
            <>
              {" "}
              <br />
              {titleTail}
            </>
          ) : null}
        </h1>
        <p {...stylex.props(styles.place)}>{repairText(place)}</p>
        <hr {...stylex.props(styles.rule)} />
        <p {...stylex.props(styles.tagline)}>{motto}</p>
      </div>

      <button
        aria-label="Scroll to the next section"
        onClick={scrollToNextSection}
        type="button"
        {...stylex.props(styles.scrollCue)}
      >
        <svg
          aria-hidden="true"
          fill="none"
          height="18"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          width="18"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
    </section>
  );
};

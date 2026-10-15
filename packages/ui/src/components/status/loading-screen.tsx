import * as stylex from "@stylexjs/stylex";
import { useEffect, useState } from "react";

import { COLLEGE_LOCATION, COLLEGE_NAME, MOTTO } from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import {
  color,
  font,
  layer,
  motionToken,
  space,
} from "../../tokens/tokens.stylex";
import { VisuallyHidden } from "../primitives/layout";

/** Never show the splash for less than this, so it reads as a deliberate beat rather than a flash. */
const MIN_VISIBLE_MS = 900;
/** A page that has not finished loading by now gets the splash dismissed anyway. */
const MAX_VISIBLE_MS = 8000;
/** While the page is still loading the bar creeps towards this, then waits. */
const WAITING_TARGET = 90;
/** Fraction of the remaining distance covered per second; gives the ease-out feel. */
const EASE_PER_SECOND = 3.2;
/** Once the page is ready the bar closes the gap quickly instead of crawling the last few percent. */
const FINISH_EASE_PER_SECOND = 9;
const HOLD_AT_FULL_MS = 250;
const FADE_MS = 450;
const FULL = 100;

const styles = stylex.create({
  // <output> is the live region; it must not add a box of its own.
  status: {
    display: "contents",
  },
  screen: {
    position: "fixed",
    inset: 0,
    zIndex: layer.skipLink,
    // Reduced motion: no animated splash at all, rather than a softened one.
    display: {
      default: "flex",
      [bp.reducedMotion]: "none",
    },
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minBlockSize: "100svh",
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
    opacity: 1,
    transitionProperty: "opacity",
    transitionDuration: `${FADE_MS}ms`,
    transitionTimingFunction: motionToken.ease,
  },
  leaving: {
    opacity: 0,
    pointerEvents: "none",
  },

  crestBox: {
    position: "relative",
    inlineSize: "clamp(5.5rem, 4.5rem + 3vw, 7rem)",
    aspectRatio: "112 / 136",
  },
  crestLayer: {
    position: "absolute",
    inset: 0,
    inlineSize: "100%",
    blockSize: "100%",
    objectFit: "contain",
  },
  crestGhost: {
    opacity: 0.12,
    filter: "grayscale(1) brightness(2)",
  },

  caption: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: space["2xs"],
    marginBlockStart: space.xl,
    paddingInline: space.gutter,
    textAlign: "center",
  },
  name: {
    margin: 0,
    // The trailing tracking space would push centred text off-axis.
    paddingInlineStart: "0.46em",
    fontSize: font.sizeXs,
    fontWeight: font.weightSemibold,
    letterSpacing: "0.46em",
    textTransform: "uppercase",
  },
  place: {
    margin: 0,
    fontFamily: font.display,
    fontStyle: "italic",
    fontSize: font.sizeLg,
    color: color.onInverseSubtle,
  },

  track: {
    position: "relative",
    inlineSize: "min(11.25rem, 60vw)",
    blockSize: space.px,
    marginBlockStart: space["2xl"],
    backgroundColor: color.borderInverse,
  },
  fill: {
    position: "absolute",
    insetBlockStart: 0,
    insetInlineStart: 0,
    blockSize: space.px,
    backgroundColor: color.accent,
  },
  percent: {
    margin: 0,
    marginBlockStart: space.xs,
    fontFamily: font.mono,
    fontSize: font.size2xs,
    letterSpacing: font.trackingWider,
    color: color.onInverseSubtle,
    fontVariantNumeric: "tabular-nums",
  },

  footer: {
    position: "absolute",
    insetInline: space.gutter,
    insetBlockEnd: `max(${space.lg}, env(safe-area-inset-bottom))`,
    display: "flex",
    justifyContent: "space-between",
    gap: space.sm,
    fontSize: font.size2xs,
    fontWeight: font.weightSemibold,
    letterSpacing: font.trackingUltra,
    textTransform: "uppercase",
    color: color.onInverseSubtle,
  },
  footerItem: {
    whiteSpace: "nowrap",
  },
});

/**
 * The crest fills from the bottom as progress rises: a dim ghost underneath, and
 * the full-colour crest clipped from the top by the *remaining* percentage.
 */
export const LoadingView = ({
  progress,
  crestSrc = "/logo.png",
  leaving = false,
}: {
  /** 0-100. */
  progress: number;
  crestSrc?: string;
  leaving?: boolean;
}) => {
  const rounded = Math.round(progress);
  return (
    <div
      data-loading-screen=""
      {...stylex.props(styles.screen, leaving && styles.leaving)}
    >
      <div aria-hidden="true" {...stylex.props(styles.crestBox)}>
        <img
          alt=""
          decoding="async"
          src={crestSrc}
          {...stylex.props(styles.crestLayer, styles.crestGhost)}
        />
        <img
          alt=""
          decoding="async"
          src={crestSrc}
          style={{ clipPath: `inset(${FULL - progress}% 0 0 0)` }}
          {...stylex.props(styles.crestLayer)}
        />
      </div>

      <div {...stylex.props(styles.caption)}>
        <p {...stylex.props(styles.name)}>{COLLEGE_NAME}</p>
        <p {...stylex.props(styles.place)}>{COLLEGE_LOCATION}</p>
      </div>

      <div aria-hidden="true" {...stylex.props(styles.track)}>
        <div
          style={{ inlineSize: `${progress}%` }}
          {...stylex.props(styles.fill)}
        />
      </div>
      <p aria-hidden="true" {...stylex.props(styles.percent)}>
        {String(rounded).padStart(3, "0")}
      </p>

      <div aria-hidden="true" {...stylex.props(styles.footer)}>
        <span {...stylex.props(styles.footerItem)}>{MOTTO}</span>
        <span {...stylex.props(styles.footerItem)}>Official website</span>
      </div>
    </div>
  );
};

/**
 * First-load splash. Server-rendered, so a visitor sees it before any
 * JavaScript arrives; it then tracks the real page load and fades out.
 *
 * Without JavaScript it would cover the page forever, so `__root.tsx` hides it
 * in a `<noscript>` rule. Under `prefers-reduced-motion` the CSS hides it
 * outright rather than animating it. Mounted only in the root document, so
 * client-side navigation never replays it.
 */
export const LoadingScreen = ({ crestSrc }: { crestSrc?: string }) => {
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    // CSS already hides the splash for these visitors; do not lock their scroll
    // or spin an animation loop behind an overlay nobody can see.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const startedAt = performance.now();
    let loaded = document.readyState === "complete";
    let fontsReady = false;
    let current = 0;
    let last = startedAt;
    let frame = 0;
    const timers: number[] = [];

    const finish = () => {
      setProgress(FULL);
      timers.push(
        window.setTimeout(() => {
          setLeaving(true);
          timers.push(window.setTimeout(() => setGone(true), FADE_MS));
        }, HOLD_AT_FULL_MS)
      );
    };

    const onLoad = () => {
      loaded = true;
    };
    if (!loaded) {
      window.addEventListener("load", onLoad, { once: true });
    }
    (async () => {
      await document.fonts?.ready;
      fontsReady = true;
    })();

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const canFinish = loaded && fontsReady && elapsed >= MIN_VISIBLE_MS;
      const timedOut = elapsed >= MAX_VISIBLE_MS;
      const target = canFinish || timedOut ? FULL : WAITING_TARGET;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const rate = target === FULL ? FINISH_EASE_PER_SECOND : EASE_PER_SECOND;
      current += (target - current) * Math.min(1, rate * dt);

      if (target === FULL && FULL - current < 0.5) {
        finish();
        return;
      }
      setProgress(current);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    // The page behind must not scroll while the splash covers it.
    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("load", onLoad);
      for (const timer of timers) {
        clearTimeout(timer);
      }
      document.documentElement.style.overflow = previousOverflow;
    };
  }, []);

  // Restore scrolling the moment the fade begins, not when the node unmounts.
  useEffect(() => {
    if (leaving) {
      document.documentElement.style.overflow = "";
    }
  }, [leaving]);

  if (gone) {
    return null;
  }

  return (
    <output aria-busy={!leaving} {...stylex.props(styles.status)}>
      <VisuallyHidden>Loading {COLLEGE_NAME}</VisuallyHidden>
      <LoadingView crestSrc={crestSrc} leaving={leaving} progress={progress} />
    </output>
  );
};

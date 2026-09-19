import * as stylex from "@stylexjs/stylex";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

import { bp } from "../../tokens/breakpoints.stylex";
import { motionToken } from "../../tokens/tokens.stylex";

const styles = stylex.create({
  block: {
    display: "block",
  },
  hidden: {
    opacity: 0,
  },
  hiddenUp: { transform: "translateY(1.5rem)" },
  hiddenLeft: { transform: "translateX(-1.5rem)" },
  hiddenRight: { transform: "translateX(1.5rem)" },
  visible: {
    opacity: 1,
    transform: "none",
    transitionProperty: "opacity, transform",
    transitionTimingFunction: motionToken.ease,
    // Belt and braces: the global reduced-motion rule already neutralises this,
    // and the hidden state is never applied for those users in the first place.
    transitionDuration: {
      default: motionToken.slow,
      [bp.reducedMotion]: "0s",
    },
  },
  // Stagger steps, as classes rather than inline styles so the whole page stays
  // free of per-element style attributes.
  delay1: { transitionDelay: "0.1s" },
  delay2: { transitionDelay: "0.2s" },
});

type Direction = "up" | "left" | "right" | "none";

const HIDDEN_OFFSET = {
  up: styles.hiddenUp,
  left: styles.hiddenLeft,
  right: styles.hiddenRight,
  none: null,
} as const;

const VISIBLE_RATIO = 0.15;

/**
 * `useLayoutEffect` so the hidden class lands before the browser paints; plain
 * `useEffect` on the server, where layout effects do not run and React warns if
 * a component references them.
 */
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Scroll-triggered entrance.
 *
 * The hidden state is applied on the *client only*, in a layout effect before
 * first paint. Server-rendered HTML therefore always contains the final, visible
 * content - which matters for three reasons:
 *
 *  1. No hydration mismatch. Rendering `opacity: 0` on the server and a visible
 *     element on the client leaves the server's inline style in the DOM, and the
 *     content stays invisible forever (this is exactly what happened with a
 *     `motion` `initial` prop under `prefers-reduced-motion`).
 *  2. Crawlers and no-JS visitors see the content.
 *  3. Elements already in the viewport at mount are never hidden, so there is no
 *     flash of empty space above the fold.
 *
 * Under `prefers-reduced-motion: reduce` nothing is hidden and no observer is
 * created at all.
 */
export const Reveal = ({
  children,
  direction = "up",
  delay = 0,
  style,
}: {
  children: ReactNode;
  direction?: Direction;
  /** Stagger step (0 = none, 1 = 100ms, 2 = 200ms). */
  delay?: 0 | 1 | 2;
  style?: stylex.StyleXStyles;
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "hidden" | "visible">("idle");

  useIsomorphicLayoutEffect(() => {
    const node = ref.current;
    if (!node) {
      return;
    }
    /*
     * Both capabilities are feature-detected, and both bail out to the final
     * visible state rather than to a hidden one - an environment that cannot
     * animate must still show the content.
     *
     * `matchMedia` was previously called bare. It is absent in jsdom and in
     * older embedded webviews (some kiosk and smart-TV browsers), where the
     * throw escaped the layout effect and unmounted the whole tree - so the
     * page rendered blank rather than merely un-animated.
     */
    if (
      typeof matchMedia !== "function" ||
      matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    if (typeof IntersectionObserver === "undefined") {
      return;
    }

    const rect = node.getBoundingClientRect();
    const alreadyVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (alreadyVisible) {
      return;
    }

    setState("hidden");
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setState("visible");
            observer.disconnect();
          }
        }
      },
      { threshold: VISIBLE_RATIO }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      {...stylex.props(
        styles.block,
        state === "hidden" && styles.hidden,
        state === "hidden" && HIDDEN_OFFSET[direction],
        state === "visible" && styles.visible,
        state === "visible" && delay === 1 && styles.delay1,
        state === "visible" && delay === 2 && styles.delay2,
        style
      )}
    >
      {children}
    </div>
  );
};

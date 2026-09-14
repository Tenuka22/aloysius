import Lenis from "lenis";
import { useEffect } from "react";

/**
 * Momentum scrolling.
 *
 * Deliberately disabled for two groups:
 *  - users who asked the OS to reduce motion (WCAG 2.2 SC 2.3.3), and
 *  - coarse pointers, where the OS already provides native momentum and Lenis
 *    only adds input lag on touch screens, kiosks and smart boards.
 *
 * It is also re-evaluated when either preference changes mid-session.
 */
export const SmoothScroll = () => {
  useEffect(() => {
    const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
    const coarsePointer = matchMedia("(pointer: coarse)");
    let lenis: Lenis | null = null;

    const sync = () => {
      const shouldRun = !(reduceMotion.matches || coarsePointer.matches);
      if (shouldRun && !lenis) {
        lenis = new Lenis({ autoRaf: true, smoothWheel: true });
      } else if (!shouldRun && lenis) {
        lenis.destroy();
        lenis = null;
      }
    };

    sync();
    reduceMotion.addEventListener("change", sync);
    coarsePointer.addEventListener("change", sync);

    return () => {
      reduceMotion.removeEventListener("change", sync);
      coarsePointer.removeEventListener("change", sync);
      lenis?.destroy();
    };
  }, []);

  return null;
};

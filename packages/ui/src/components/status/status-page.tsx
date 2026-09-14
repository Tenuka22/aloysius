import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";

import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, motionToken, space } from "../../tokens/tokens.stylex";
import { ButtonLink } from "../primitives/button";
import { SkipLink } from "../primitives/layout";
import { SiteHeader } from "../site/site-header";

const MAIN_ID = "main-content";

const styles = stylex.create({
  /*
   * `100svh`, not `100vh`. On iOS Safari and Chrome Android `vh` resolves
   * against the *largest* viewport, so a `100vh` panel is taller than the
   * visible area while the URL bar is showing and the actions sit below the
   * fold. `svh` is the small viewport, so the layout is correct at rest.
   *
   * `min-block-size`, not `block-size`: on a 320px phone the copy plus actions
   * can exceed the viewport, and a fixed height would clip them. From 64rem up
   * the two-column layout always fits, so the shell is pinned to exactly one
   * viewport and the page never scrolls - the whole screen is one composition.
   */
  shell: {
    display: "flex",
    flexDirection: "column",
    minBlockSize: "100svh",
    blockSize: {
      default: "auto",
      [bp.xl]: "100svh",
    },
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
  },
  shellDeep: {
    backgroundColor: color.surfaceInverseDeep,
  },

  main: {
    flex: "1 1 auto",
    display: "grid",
    placeItems: "center",
    position: "relative",
    paddingBlock: {
      default: space["2xl"],
      [bp.xl]: space.xl,
    },
    paddingInline: space.gutter,
    /*
     * A flex child's default `min-block-size: auto` refuses to shrink below its
     * content, which would push the pinned shell taller than the viewport and
     * bring the page scrollbar back. `0` lets it shrink; `overflowY: auto` then
     * means a short desktop window (a 1280x600 split screen, say) scrolls
     * inside this region instead of clipping the actions.
     */
    minBlockSize: {
      default: "auto",
      [bp.xl]: 0,
    },
    overflowY: {
      default: "visible",
      [bp.xl]: "auto",
    },
    // A decorative crest is absolutely positioned inside; clip so it can never
    // widen the document on a kiosk or smart board.
    overflowX: "clip",
    outline: {
      default: null,
      // The skip link focuses <main>; suppress the global ring on the whole page.
      ":focus": "none",
    },
  },

  /** Watermark crest. Purely decorative, never a layout participant. */
  crest: {
    position: "absolute",
    insetInlineEnd: "-9rem",
    insetBlockEnd: "-11rem",
    blockSize: "clamp(20rem, 55vw, 39rem)",
    inlineSize: "auto",
    opacity: 0.05,
    pointerEvents: "none",
    userSelect: "none",
    // Hidden on phones: at that size it sits behind the copy and costs contrast.
    display: {
      default: "none",
      [bp.lg]: "block",
    },
  },
  crestStart: {
    insetInlineEnd: "auto",
    insetBlockEnd: "auto",
    insetInlineStart: "-9rem",
    insetBlockStart: "-10rem",
  },

  /*
   * Single column on phones and tablets; artwork beside the copy from 64rem.
   * `minmax(0, …)` on both tracks is what stops a long unbroken word or the SVG
   * from forcing the grid wider than its container.
   */
  layout: {
    position: "relative",
    inlineSize: "100%",
    marginInline: "auto",
    display: "grid",
    gap: space.xl,
    justifyItems: {
      default: "center",
      [bp.xl]: "start",
    },
    textAlign: {
      default: "center",
      [bp.xl]: "start",
    },
    alignItems: "center",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.xl]: "minmax(0, 22rem) minmax(0, 1fr)",
    },
    // Widen the measure on very large panels rather than stranding a ribbon.
    maxInlineSize: {
      default: space.content,
      [bp.ultra]: space.contentWide,
    },
  },

  /*
   * DOM order is copy-then-artwork so screen readers and search engines get the
   * message first; on two-column layouts the artwork is moved to the left
   * visually. Only reordering *decorative* content this way is safe - it has no
   * reading order of its own.
   */
  art: {
    gridRow: {
      default: "auto",
      [bp.xl]: 1,
    },
    gridColumn: {
      default: "auto",
      [bp.xl]: 1,
    },
    order: {
      default: -1,
      [bp.xl]: 0,
    },
  },
  copy: {
    minWidth: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: {
      default: "center",
      [bp.xl]: "flex-start",
    },
  },

  eyebrow: {
    margin: 0,
    marginBlockEnd: space.sm,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingUltra,
    textTransform: "uppercase",
    color: color.accentOnInverse,
  },

  /*
   * The oversized "404" / "500". It is a graphic, not a heading - the real <h1>
   * follows it - so it is marked `aria-hidden` and the code is repeated in the
   * heading text for assistive tech.
   */
  numeral: {
    fontFamily: font.display,
    fontWeight: font.weightSemibold,
    fontSize: font.size4xl,
    lineHeight: "0.92",
    letterSpacing: font.trackingTight,
    margin: 0,
  },

  heading: {
    margin: 0,
    marginBlockStart: space.sm,
    fontFamily: font.display,
    fontWeight: font.weightSemibold,
    fontSize: font.size3xl,
    lineHeight: font.leadingSnug,
    letterSpacing: font.trackingTight,
    textWrap: "balance",
  },

  rule: {
    inlineSize: "3.5rem",
    blockSize: "2px",
    border: "none",
    backgroundColor: color.accent,
    marginBlock: space.md,
    marginInline: {
      default: "auto",
      [bp.xl]: 0,
    },
  },

  lead: {
    margin: 0,
    maxInlineSize: space.measure,
    fontSize: font.sizeMd,
    lineHeight: font.leadingRelaxed,
    color: color.onInverseMuted,
    textWrap: "pretty",
  },

  /*
   * Actions stack full-width on phones (a 100%-wide target is the easiest thing
   * to hit one-handed) and sit inline from 26.75rem up - `ButtonLink fluid`
   * carries that rule, so this only needs to handle wrapping and alignment.
   */
  actions: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.xs,
    marginBlockStart: space.xl,
    inlineSize: {
      default: "100%",
      [bp.sm]: "auto",
    },
    justifyContent: {
      default: "center",
      [bp.xl]: "flex-start",
    },
  },

  extra: {
    marginBlockStart: space.xl,
    inlineSize: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: {
      default: "center",
      [bp.xl]: "flex-start",
    },
  },

  /** "Try instead" chip row. */
  chipLabel: {
    margin: 0,
    marginBlockEnd: space.xs,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWidest,
    textTransform: "uppercase",
    color: color.onInverseSubtle,
  },
  chipRow: {
    display: "flex",
    flexWrap: "wrap",
    gap: space["2xs"],
    justifyContent: {
      default: "center",
      [bp.xl]: "flex-start",
    },
    // Reset the <ul> without losing the list semantics screen readers use.
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  chip: {
    display: "inline-flex",
    alignItems: "center",
    // WCAG 2.2 SC 2.5.8 target size, with headroom for kiosks and smart boards.
    minBlockSize: "2.75rem",
    paddingInline: space.sm,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: {
      default: color.borderAccent,
      ":hover": color.accent,
    },
    backgroundColor: {
      default: "transparent",
      ":hover": color.accent,
    },
    color: {
      default: color.accentOnInverse,
      ":hover": color.onAccent,
    },
    fontSize: font.sizeXs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    textDecoration: "none",
    touchAction: "manipulation",
    WebkitTapHighlightColor: "transparent",
    transitionProperty: "background-color, color, border-color",
    transitionDuration: motionToken.base,
    transitionTimingFunction: motionToken.ease,
  },
});

export interface StatusChip {
  label: string;
  href: string;
}

export interface StatusPageProps {
  /** Small uppercase label above the numeral, e.g. "Page not found". */
  eyebrow: string;
  /** The oversized display string. Decorative - repeat it in `heading`. */
  numeral: string;
  /** The real <h1>. */
  heading: string;
  /** Sentence explaining what happened and what to do next. */
  description: string;
  primaryAction: StatusChip;
  secondaryAction?: StatusChip;
  /** Decorative SVG. */
  art: ReactNode;
  /** Optional block under the actions (chip row, reference code, progress). */
  children?: ReactNode;
  /** Deeper green background, used to differentiate consecutive screens. */
  tone?: "inverse" | "inverseDeep";
  /** Which corner the watermark crest sits in. */
  crestPosition?: "end" | "start";
  crestSrc?: string;
}

/**
 * Shared shell for 404 / 500 / under-construction.
 *
 * Header only - no footer. An error page without navigation is a dead end, so
 * the header stays (its menu is the fastest recovery path), but the footer is
 * a second, longer set of links below the fold that would push the screen past
 * one viewport and bury the actual message. The explicit actions and the "try
 * instead" shortcuts are the recovery path here; contact is one of them.
 *
 * `SiteHeader` is presentational and holds no data, so it is safe to render
 * from inside an error boundary - whatever failed cannot be something it reads.
 */
export const StatusPage = ({
  eyebrow,
  numeral,
  heading,
  description,
  primaryAction,
  secondaryAction,
  art,
  children,
  tone = "inverse",
  crestPosition = "end",
  crestSrc = "/logo.png",
}: StatusPageProps) => (
  <div
    {...stylex.props(styles.shell, tone === "inverseDeep" && styles.shellDeep)}
  >
    <SkipLink targetId={MAIN_ID} />
    <SiteHeader activeHref="" />

    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      <img
        alt=""
        aria-hidden="true"
        decoding="async"
        loading="lazy"
        src={crestSrc}
        {...stylex.props(
          styles.crest,
          crestPosition === "start" && styles.crestStart
        )}
      />

      <div {...stylex.props(styles.layout)}>
        <div {...stylex.props(styles.copy)}>
          <p {...stylex.props(styles.eyebrow)}>{eyebrow}</p>
          <p aria-hidden="true" {...stylex.props(styles.numeral)}>
            {numeral}
          </p>
          <h1 {...stylex.props(styles.heading)}>{heading}</h1>
          <hr {...stylex.props(styles.rule)} />
          <p {...stylex.props(styles.lead)}>{description}</p>

          <div {...stylex.props(styles.actions)}>
            <ButtonLink fluid href={primaryAction.href} variant="solid">
              {primaryAction.label}
            </ButtonLink>
            {secondaryAction ? (
              <ButtonLink
                fluid
                href={secondaryAction.href}
                variant="outlineInverse"
              >
                {secondaryAction.label}
              </ButtonLink>
            ) : null}
          </div>

          {children ? (
            <div {...stylex.props(styles.extra)}>{children}</div>
          ) : null}
        </div>

        <div {...stylex.props(styles.art)}>{art}</div>
      </div>
    </main>
  </div>
);

/** "Try instead" shortcuts, rendered as a real list so SRs announce the count. */
export const StatusChips = ({
  label,
  items,
}: {
  label: string;
  items: readonly StatusChip[];
}) => (
  <nav aria-label={label}>
    <p {...stylex.props(styles.chipLabel)}>{label}</p>
    <ul {...stylex.props(styles.chipRow)}>
      {items.map((item) => (
        <li key={item.href}>
          <a href={item.href} {...stylex.props(styles.chip)}>
            {item.label}
          </a>
        </li>
      ))}
    </ul>
  </nav>
);

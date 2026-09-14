import * as stylex from "@stylexjs/stylex";

import { bp } from "../../tokens/breakpoints.stylex";
import { color, palette } from "../../tokens/tokens.stylex";

/*
 * Decorative artwork for the three status screens.
 *
 * Every drawing is inline SVG rather than a raster file: it is resolution
 * independent (so 2x/3x phones, 4K/5K/8K panels and smart boards all get a
 * crisp edge with no `srcset`), it costs no extra request, and it can inherit
 * the brand tokens. Each root carries `aria-hidden` and `focusable="false"` -
 * the artwork repeats what the heading already says, so exposing it would make
 * a screen reader announce the same thing twice, and IE-era SVG is focusable
 * by default which would otherwise add a dead tab stop.
 *
 * All motion is authored as a *progressive enhancement*: the static frame is
 * the SVG's own geometry, and `bp.reducedMotion` sets `animationName: none`
 * so a user who asked the OS to reduce motion sees that static frame. The
 * global `prefers-reduced-motion` rule in `index.css` clamps durations too,
 * but a clamped infinite animation still ends on an arbitrary frame - killing
 * the animation outright is what actually leaves the drawing legible.
 */

const pulse = stylex.keyframes({
  "0%, 100%": { opacity: 0.22, transform: "scale(1)" },
  "50%": { opacity: 0.5, transform: "scale(1.1)" },
});

const scan = stylex.keyframes({
  "0%, 100%": { transform: "translate(0, 0)" },
  "25%": { transform: "translate(16px, -10px)" },
  "50%": { transform: "translate(4px, 12px)" },
  "75%": { transform: "translate(-14px, -4px)" },
});

const spin = stylex.keyframes({
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(360deg)" },
});

const spinReverse = stylex.keyframes({
  from: { transform: "rotate(0deg)" },
  to: { transform: "rotate(-360deg)" },
});

const dash = stylex.keyframes({
  to: { strokeDashoffset: -28 },
});

const blink = stylex.keyframes({
  "0%, 100%": { opacity: 1 },
  "50%": { opacity: 0.2 },
});

const float = stylex.keyframes({
  "0%, 100%": { transform: "translateY(0)" },
  "50%": { transform: "translateY(-8px)" },
});

const styles = stylex.create({
  frame: {
    position: "relative",
    placeItems: "center",
    /*
     * Fluid, not fixed. The mock pinned the artwork at 290px, which is 91% of a
     * 320px viewport once the gutter is taken off. This tops out at 22rem so it
     * never dwarfs the copy on a laptop, and never overflows a mini phone.
     *
     * On phone landscape and other short viewports the artwork is the first
     * thing worth sacrificing - the actions have to stay above the fold.
     */
    inlineSize: "min(100%, clamp(11rem, 46vw, 22rem))",
    display: {
      default: "grid",
      [bp.short]: "none",
    },
  },
  halo: {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    backgroundImage: `radial-gradient(circle, rgba(255, 178, 3, 0.18), transparent 65%)`,
    animationName: {
      default: pulse,
      [bp.reducedMotion]: "none",
    },
    animationDuration: "5s",
    animationTimingFunction: "ease-in-out",
    animationIterationCount: "infinite",
    // Static frame for reduced-motion users, since the keyframes set opacity.
    opacity: {
      default: null,
      [bp.reducedMotion]: 0.32,
    },
  },
  haloDanger: {
    backgroundImage: `radial-gradient(circle, rgba(165, 25, 25, 0.3), transparent 65%)`,
  },
  svg: {
    position: "relative",
    inlineSize: "100%",
    blockSize: "auto",
    // Lets the artwork bleed past the 200-unit box without clipping strokes.
    overflow: "visible",
  },

  // --- shared animation helpers -------------------------------------------
  animated: {
    animationIterationCount: "infinite",
    animationTimingFunction: "ease-in-out",
    animationName: {
      default: null,
      [bp.reducedMotion]: "none",
    },
  },
  scanner: {
    animationName: scan,
    animationDuration: "9s",
    transformOrigin: "center",
  },
  gearLarge: {
    animationName: spin,
    animationDuration: "16s",
    animationTimingFunction: "linear",
    transformOrigin: "78px 84px",
    transformBox: "view-box",
  },
  gearSmall: {
    animationName: spinReverse,
    animationDuration: "11s",
    animationTimingFunction: "linear",
    transformOrigin: "136px 132px",
    transformBox: "view-box",
  },
  conveyor: {
    animationName: dash,
    animationDuration: "2.4s",
    animationTimingFunction: "linear",
  },
  blinkSlow: {
    animationName: blink,
    animationDuration: "1.6s",
  },
  blinkFast: {
    animationName: blink,
    animationDuration: "1.1s",
  },
  floatA: {
    animationName: float,
    animationDuration: "5s",
  },
  floatB: {
    animationName: float,
    animationDuration: "5s",
    animationDelay: "0.25s",
  },
  floatC: {
    animationName: float,
    animationDuration: "4.2s",
  },
});

/** Shared <svg> attributes. Stroke geometry is drawn on a 200x200 grid. */
const SVG_BASE = {
  "aria-hidden": true,
  focusable: "false",
  viewBox: "0 0 200 200",
  fill: "none",
  preserveAspectRatio: "xMidYMid meet",
  stroke: palette.cream,
  strokeWidth: 4,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

const Frame = ({
  children,
  danger = false,
}: {
  children: React.ReactNode;
  danger?: boolean;
}) => (
  <div {...stylex.props(styles.frame)}>
    <span {...stylex.props(styles.halo, danger && styles.haloDanger)} />
    {children}
  </div>
);

/** 404 - a magnifying glass sweeping a document and finding nothing. */
export const NotFoundArt = () => (
  <Frame>
    <svg {...SVG_BASE} {...stylex.props(styles.svg)}>
      <rect
        height="140"
        rx="4"
        stroke={color.borderInverse}
        width="108"
        x="40"
        y="26"
      />
      <path
        d="M62 60h48M62 82h64M62 104h40M112 132h34"
        stroke="rgba(255, 248, 231, 0.3)"
      />
      <g {...stylex.props(styles.animated, styles.scanner)}>
        <circle
          cx="112"
          cy="118"
          r="34"
          stroke={palette.gold}
          strokeWidth="6"
        />
        <path d="M137 143l26 26" stroke={palette.gold} strokeWidth="8" />
        <path
          d="M100 106l24 24M124 106l-24 24"
          stroke={palette.crimsonBright}
          strokeWidth="6"
        />
      </g>
    </svg>
  </Frame>
);

/** Under construction - two meshing gears over a moving conveyor. */
export const UnderConstructionArt = () => (
  <Frame>
    <svg {...SVG_BASE} {...stylex.props(styles.svg)}>
      <g {...stylex.props(styles.animated, styles.gearLarge)}>
        <circle cx="78" cy="84" r="30" stroke={palette.gold} strokeWidth="6" />
        <circle cx="78" cy="84" r="11" stroke={palette.gold} strokeWidth="5" />
        <path
          d="M78 46v-12M78 134v-12M116 84h12M40 84H28M105 57l9-9M51 111l-9 9M105 111l9 9M51 57l-9-9"
          stroke={palette.gold}
          strokeWidth="6"
        />
      </g>
      <g {...stylex.props(styles.animated, styles.gearSmall)}>
        <circle
          cx="136"
          cy="132"
          r="20"
          stroke="rgba(255, 248, 231, 0.6)"
          strokeWidth="5"
        />
        <circle
          cx="136"
          cy="132"
          r="7"
          stroke="rgba(255, 248, 231, 0.6)"
          strokeWidth="4"
        />
        <path
          d="M136 105v-9M136 168v-9M163 132h9M109 132h-9M155 113l7-7M117 158l-7 7M155 151l7 7M117 106l-7-7"
          stroke="rgba(255, 248, 231, 0.6)"
          strokeWidth="5"
        />
      </g>
      <path
        d="M26 178h148"
        stroke={palette.crimsonBright}
        strokeDasharray="12 8"
        strokeWidth="6"
        {...stylex.props(styles.animated, styles.conveyor)}
      />
    </svg>
  </Frame>
);

/** 500 - stacked servers with a warning triangle below them. */
export const ServerErrorArt = () => (
  <Frame danger>
    <svg {...SVG_BASE} {...stylex.props(styles.svg)}>
      <g {...stylex.props(styles.animated, styles.floatA)}>
        <rect
          height="38"
          rx="5"
          stroke="rgba(255, 248, 231, 0.6)"
          width="128"
          x="36"
          y="36"
        />
        <circle
          cx="54"
          cy="55"
          fill={palette.gold}
          r="4.5"
          stroke="none"
          {...stylex.props(styles.animated, styles.blinkSlow)}
        />
        <path d="M132 55h18" stroke="rgba(255, 248, 231, 0.4)" />
      </g>
      <g {...stylex.props(styles.animated, styles.floatB)}>
        <rect
          height="38"
          rx="5"
          stroke="rgba(255, 248, 231, 0.6)"
          width="128"
          x="36"
          y="86"
        />
        <circle
          cx="54"
          cy="105"
          fill={palette.crimsonBright}
          r="4.5"
          stroke="none"
          {...stylex.props(styles.animated, styles.blinkFast)}
        />
        <path d="M132 105h18" stroke="rgba(255, 248, 231, 0.4)" />
      </g>
      <g {...stylex.props(styles.animated, styles.floatC)}>
        <path
          d="M100 132l42 56H58z"
          fill={palette.greenDeep}
          stroke={palette.gold}
          strokeWidth="6"
        />
        <path d="M100 150v18" stroke={palette.gold} strokeWidth="6" />
        <circle cx="100" cy="178" fill={palette.gold} r="3.4" stroke="none" />
      </g>
    </svg>
  </Frame>
);

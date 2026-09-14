import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";

import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, motionToken, space } from "../../tokens/tokens.stylex";

/**
 * Minimum interactive size. WCAG 2.2 SC 2.5.8 requires 24x24 CSS px; 44px is the
 * Apple/Android guidance and the right target for kiosks and smart boards, so
 * that is what we enforce everywhere.
 */
const MIN_TARGET = "2.75rem";

const styles = stylex.create({
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: space["2xs"],
    minHeight: MIN_TARGET,
    paddingBlock: space.xs,
    paddingInline: space.md,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: "transparent",
    fontFamily: font.body,
    fontSize: font.sizeSm,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    lineHeight: font.leadingSnug,
    textAlign: "center",
    textDecoration: "none",
    cursor: "pointer",
    // Stops double-tap zoom delay on touch devices.
    touchAction: "manipulation",
    // Prevents the grey flash on iOS Safari.
    WebkitTapHighlightColor: "transparent",
    transitionProperty: "background-color, color, border-color, transform",
    transitionDuration: motionToken.base,
    transitionTimingFunction: motionToken.ease,
  },
  // Hover lift only where a real pointer exists - on touch devices a :hover
  // transform sticks after the tap until the user taps elsewhere.
  lift: {
    transform: {
      default: "translateY(0)",
      [bp.hover]: {
        default: "translateY(0)",
        ":hover": "translateY(-2px)",
        ":active": "translateY(0)",
      },
    },
  },

  solid: {
    backgroundColor: {
      default: color.accent,
      ":hover": color.accentHover,
    },
    color: color.onAccent,
  },
  outline: {
    backgroundColor: {
      default: "transparent",
      ":hover": color.accent,
    },
    borderColor: {
      default: color.borderStrong,
      ":hover": color.accent,
    },
    color: {
      default: color.onSurface,
      ":hover": color.onAccent,
    },
  },
  outlineInverse: {
    backgroundColor: {
      default: "transparent",
      ":hover": color.accent,
    },
    borderColor: {
      default: color.borderInverse,
      ":hover": color.accent,
    },
    color: {
      default: color.onInverse,
      ":hover": color.onAccent,
    },
  },
  ghost: {
    backgroundColor: {
      default: "transparent",
      ":hover": color.placeholder,
    },
    color: color.onSurface,
  },

  // Phones get full-width buttons in a column; from 26.75rem they sit inline.
  responsiveBlock: {
    width: {
      default: "100%",
      [bp.sm]: "auto",
    },
  },

  /** Text link with the gold underline used throughout the design. */
  quietLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: space["2xs"],
    minHeight: MIN_TARGET,
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    textDecoration: "none",
    color: {
      default: color.onSurface,
      ":hover": color.accentOnSurface,
    },
    borderBlockEndWidth: "2px",
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.accent,
    paddingBlockEnd: space["3xs"],
    alignSelf: "flex-start",
    transitionProperty: "color, gap",
    transitionDuration: motionToken.fast,
  },
  quietLinkInverse: {
    color: {
      default: color.accentOnInverse,
      ":hover": color.accentHover,
    },
  },
  arrow: {
    transitionProperty: "transform",
    transitionDuration: motionToken.fast,
    transitionTimingFunction: motionToken.ease,
  },
});

type Variant = "solid" | "outline" | "outlineInverse" | "ghost";

const VARIANTS = {
  solid: styles.solid,
  outline: styles.outline,
  outlineInverse: styles.outlineInverse,
  ghost: styles.ghost,
} as const;

interface CommonProps {
  children: ReactNode;
  variant?: Variant;
  /** Full width on phones, intrinsic width from 26.75rem up. */
  fluid?: boolean;
  style?: stylex.StyleXStyles;
}

export const ButtonLink = ({
  children,
  href,
  variant = "solid",
  fluid = false,
  external = false,
  style,
}: CommonProps & { href: string; external?: boolean }) => (
  <a
    href={href}
    rel={external ? "noopener noreferrer" : undefined}
    target={external ? "_blank" : undefined}
    {...stylex.props(
      styles.base,
      styles.lift,
      VARIANTS[variant],
      fluid && styles.responsiveBlock,
      style
    )}
  >
    {children}
  </a>
);

/** "Explore Our History →" - the underlined tertiary link in the design. */
export const ArrowLink = ({
  children,
  href,
  inverse = false,
}: {
  children: ReactNode;
  href: string;
  inverse?: boolean;
}) => (
  <a
    href={href}
    {...stylex.props(styles.quietLink, inverse && styles.quietLinkInverse)}
  >
    {children}
    <span aria-hidden="true" {...stylex.props(styles.arrow)}>
      &rarr;
    </span>
  </a>
);

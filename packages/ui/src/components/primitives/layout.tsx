import * as stylex from "@stylexjs/stylex";
import type { ElementType, ReactNode } from "react";

import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, layer, space } from "../../tokens/tokens.stylex";

const styles = stylex.create({
  container: {
    width: "100%",
    marginInline: "auto",
    /*
     * `space.content` already subtracts the fluid gutter, so the column breathes
     * at 320px and caps at a readable width - then `contentWide` takes over on
     * 4K/5K/8K panels instead of stranding the page in a narrow ribbon.
     */
    maxWidth: space.content,
  },
  containerWide: {
    maxWidth: space.contentWide,
  },
  containerFull: {
    maxWidth: "none",
    paddingInline: space.gutter,
  },

  section: {
    position: "relative",
    paddingBlock: space.section,
    paddingInline: space.gutter,
    // Contain paint so a decorative watermark can never widen the document.
    overflowX: "clip",
  },
  toneSurface: {
    backgroundColor: color.surface,
    color: color.onSurface,
  },
  toneRaised: {
    backgroundColor: color.surfaceRaised,
    color: color.onSurface,
    borderBlockStartWidth: space.px,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: color.border,
  },
  toneInverse: {
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
  },
  toneInverseGradient: {
    backgroundImage: `linear-gradient(180deg, ${color.surfaceInverse}, ${color.surfaceInverseDeep})`,
    color: color.onInverse,
  },

  stack: {
    display: "flex",
    flexDirection: "column",
  },
  stackXs: { gap: space.xs },
  stackSm: { gap: space.sm },
  stackMd: { gap: space.md },
  stackLg: { gap: space.lg },
  stackXl: { gap: space.xl },

  eyebrow: {
    display: "block",
    margin: 0,
    marginBlockEnd: space.sm,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingUltra,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  eyebrowInverse: {
    color: color.accentOnInverse,
  },

  heading: {
    margin: 0,
    fontFamily: font.display,
    fontWeight: font.weightSemibold,
    fontSize: font.size3xl,
    lineHeight: font.leadingTight,
    letterSpacing: font.trackingTight,
    // Keeps a lone word from dropping to its own line on narrow phones.
    textWrap: "balance",
  },

  lead: {
    margin: 0,
    maxWidth: space.measure,
    fontSize: font.sizeMd,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  leadInverse: {
    color: color.onInverseMuted,
  },

  /**
   * Section header: heading on the left, an optional "view all" link on the
   * right. Wraps to two rows below 40rem instead of squeezing both.
   */
  sectionHeader: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.md,
    alignItems: {
      default: "flex-start",
      [bp.md]: "flex-end",
    },
    justifyContent: "space-between",
    marginBlockEnd: space.xl,
  },

  skipLink: {
    position: "absolute",
    insetBlockStart: space.sm,
    insetInlineStart: space.sm,
    zIndex: layer.skipLink,
    /*
     * Off-screen until focused, rather than display:none which is unfocusable.
     *
     * `:focus`, not `:focus-visible`. Switch access, voice control and screen
     * reader "next control" navigation move focus without the heuristics that
     * make `:focus-visible` match, which would leave the link focused but still
     * translated off-screen - a focusable control the user cannot see (WCAG 2.2
     * SC 2.4.7 and 2.4.11). A skip link is only ever reached by keyboard-class
     * input anyway, so there is no pointer case to suppress.
     */
    transform: {
      default: "translateY(-200%)",
      ":focus": "translateY(0)",
    },
    backgroundColor: color.accent,
    color: color.onAccent,
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    paddingBlock: space.xs,
    paddingInline: space.md,
    textDecoration: "none",
  },

  visuallyHidden: {
    position: "absolute",
    width: "1px",
    height: "1px",
    margin: "-1px",
    padding: 0,
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    borderWidth: 0,
  },
});

export type Tone = "surface" | "raised" | "inverse" | "inverseGradient";

const TONE_STYLES = {
  surface: styles.toneSurface,
  raised: styles.toneRaised,
  inverse: styles.toneInverse,
  inverseGradient: styles.toneInverseGradient,
} as const;

export const Section = ({
  children,
  tone = "surface",
  id,
  labelledBy,
  style,
}: {
  children: ReactNode;
  tone?: Tone;
  id?: string;
  labelledBy?: string;
  style?: stylex.StyleXStyles;
}) => (
  <section
    aria-labelledby={labelledBy}
    id={id}
    {...stylex.props(styles.section, TONE_STYLES[tone], style)}
  >
    {children}
  </section>
);

export const Container = ({
  children,
  width = "default",
  as: Tag = "div",
  style,
}: {
  children: ReactNode;
  width?: "default" | "wide" | "full";
  as?: ElementType;
  style?: stylex.StyleXStyles;
}) => (
  <Tag
    {...stylex.props(
      styles.container,
      width === "wide" && styles.containerWide,
      width === "full" && styles.containerFull,
      style
    )}
  >
    {children}
  </Tag>
);

const STACK_GAP = {
  xs: styles.stackXs,
  sm: styles.stackSm,
  md: styles.stackMd,
  lg: styles.stackLg,
  xl: styles.stackXl,
} as const;

export const Stack = ({
  children,
  gap = "md",
  style,
}: {
  children: ReactNode;
  gap?: keyof typeof STACK_GAP;
  style?: stylex.StyleXStyles;
}) => (
  <div {...stylex.props(styles.stack, STACK_GAP[gap], style)}>{children}</div>
);

export const Eyebrow = ({
  children,
  inverse = false,
}: {
  children: ReactNode;
  inverse?: boolean;
}) => (
  <p {...stylex.props(styles.eyebrow, inverse && styles.eyebrowInverse)}>
    {children}
  </p>
);

export const Heading = ({
  children,
  level = 2,
  id,
  style,
}: {
  children: ReactNode;
  level?: 1 | 2 | 3 | 4;
  id?: string;
  style?: stylex.StyleXStyles;
}) => {
  const Tag = `h${level}` as ElementType;
  return (
    <Tag id={id} {...stylex.props(styles.heading, style)}>
      {children}
    </Tag>
  );
};

export const Lead = ({
  children,
  inverse = false,
  style,
}: {
  children: ReactNode;
  inverse?: boolean;
  style?: stylex.StyleXStyles;
}) => (
  <p {...stylex.props(styles.lead, inverse && styles.leadInverse, style)}>
    {children}
  </p>
);

export const SectionHeader = ({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) => (
  <div {...stylex.props(styles.sectionHeader)}>
    <div>{children}</div>
    {action}
  </div>
);

export const SkipLink = ({ targetId }: { targetId: string }) => (
  <a href={`#${targetId}`} {...stylex.props(styles.skipLink)}>
    Skip to main content
  </a>
);

export const VisuallyHidden = ({ children }: { children: ReactNode }) => (
  <span {...stylex.props(styles.visuallyHidden)}>{children}</span>
);

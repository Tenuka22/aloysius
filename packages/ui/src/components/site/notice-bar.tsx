import * as stylex from "@stylexjs/stylex";
import { ArrowRight, Megaphone } from "lucide-react";

import type { Notice } from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, motionToken, space } from "../../tokens/tokens.stylex";

const styles = stylex.create({
  bar: {
    backgroundColor: color.surfaceInverseDeep,
    color: color.onInverse,
    paddingBlock: space["2xs"],
    paddingInline: space.gutter,
    fontSize: font.sizeXs,
  },
  inner: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    // On a 320px phone the label, text and link stack; from 48rem they sit in a
    // single row with the link pushed to the end.
    gap: {
      default: space["2xs"],
      [bp.lg]: space.md,
    },
    marginInline: "auto",
    maxWidth: space.contentWide,
  },
  label: {
    display: "inline-flex",
    alignItems: "center",
    gap: space["3xs"],
    flexShrink: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
  },
  labelStandard: { color: color.accent },
  labelHigh: { color: color.dangerBright },
  icon: {
    width: "0.875rem",
    height: "0.875rem",
  },
  text: {
    margin: 0,
    flex: "1 1 16rem",
    minWidth: 0,
    color: color.onInverseMuted,
    lineHeight: font.leadingNormal,
    // Two lines maximum on a phone; the full text is on the notices page.
    overflow: "hidden",
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp: {
      default: 2,
      [bp.lg]: 1,
    },
  },
  link: {
    display: "inline-flex",
    alignItems: "center",
    gap: space["3xs"],
    flexShrink: 0,
    minHeight: "2.75rem",
    marginInlineStart: {
      default: 0,
      [bp.lg]: "auto",
    },
    fontWeight: font.weightSemibold,
    textDecoration: "none",
    whiteSpace: "nowrap",
    color: {
      default: color.accent,
      ":hover": color.accentHover,
    },
    transitionProperty: "color",
    transitionDuration: motionToken.fast,
  },
  linkIcon: {
    width: "0.875rem",
    height: "0.875rem",
  },
});

/**
 * Top notice strip.
 *
 * The priority is conveyed by the word "Urgent"/"Notice" as well as the colour -
 * colour alone would fail WCAG 1.4.1, which the original design did.
 */
export const NoticeBar = ({ notice }: { notice: Notice }) => {
  const isHigh = notice.priority === "high";

  return (
    <div {...stylex.props(styles.bar)}>
      <div {...stylex.props(styles.inner)}>
        <span
          {...stylex.props(
            styles.label,
            isHigh ? styles.labelHigh : styles.labelStandard
          )}
        >
          <Megaphone aria-hidden="true" {...stylex.props(styles.icon)} />
          {isHigh ? "Urgent" : "Notice"}
        </span>
        <p {...stylex.props(styles.text)}>{notice.text}</p>
        <a href={notice.href} {...stylex.props(styles.link)}>
          View all notices
          <ArrowRight aria-hidden="true" {...stylex.props(styles.linkIcon)} />
        </a>
      </div>
    </div>
  );
};

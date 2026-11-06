import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";

import { Media } from "../primitives/media";
import type { ImageSource } from "../primitives/media";
import { dc } from "./dc-styles";

/*
 * Building blocks for the homepage sections below the hero.
 *
 * These carry the exact measurements from the approved UI/UX design file
 * (Homepage.dc.html) - section padding, column widths, type sizes, letter
 * spacing - rather than the site-wide fluid tokens, because the brief is a
 * like-for-like match with that design. Hero and navigation do not use them.
 */

export const DcSection = ({
  children,
  tone,
  labelledBy,
  id,
  style,
}: {
  children: ReactNode;
  tone: "cream" | "raised" | "green" | "greenGradient" | "black";
  labelledBy?: string;
  id?: string;
  style?: stylex.StyleXStyles;
}) => {
  const toneStyle = {
    cream: dc.toneCream,
    raised: dc.toneRaised,
    green: dc.toneGreen,
    greenGradient: dc.toneGreenGradient,
    black: dc.toneBlack,
  }[tone];
  return (
    <section
      aria-labelledby={labelledBy}
      id={id}
      {...stylex.props(dc.section, toneStyle, style)}
    >
      {children}
    </section>
  );
};

export const DcInner = ({
  children,
  narrow = false,
  style,
}: {
  children: ReactNode;
  narrow?: boolean;
  style?: stylex.StyleXStyles;
}) => (
  <div {...stylex.props(dc.inner, narrow && dc.innerNarrow, style)}>
    {children}
  </div>
);

export const DcEyebrow = ({
  children,
  gold = false,
  style,
}: {
  children: ReactNode;
  gold?: boolean;
  style?: stylex.StyleXStyles;
}) => (
  <p {...stylex.props(dc.eyebrow, gold && dc.eyebrowGold, style)}>{children}</p>
);

export const DcHeading = ({
  children,
  id,
  style,
}: {
  children: ReactNode;
  id?: string;
  style?: stylex.StyleXStyles;
}) => (
  <h2 id={id} {...stylex.props(dc.heading, style)}>
    {children}
  </h2>
);

export const DcLink = ({
  children,
  href,
  gold = false,
}: {
  children: ReactNode;
  href: string;
  gold?: boolean;
}) => (
  <a href={href} {...stylex.props(dc.link, gold && dc.linkGold)}>
    {children}
  </a>
);

/**
 * A fixed-size photograph box - the design's `image-slot`. The wrapper owns the
 * size (passed as `style`); the image or placeholder fills it.
 */
export const DcSlot = ({
  source,
  placeholder,
  style,
  inverse = false,
}: {
  source?: ImageSource;
  placeholder: string;
  style?: stylex.StyleXStyles;
  inverse?: boolean;
}) => (
  <div {...stylex.props(dc.slot, style)}>
    <Media fill inverse={inverse} placeholder={placeholder} source={source} />
  </div>
);

import * as stylex from "@stylexjs/stylex";

import {
  CONTACT_DEFAULT_ADDRESS,
  CONTACT_MAP_LINK_LABEL,
  CONTACT_MAP_PLACEHOLDER,
  CONTACT_MAP_TITLE,
} from "../../content/contact";
import { bp } from "../../tokens/breakpoints.stylex";
import {
  color,
  font,
  motionToken,
  shadow,
  space,
} from "../../tokens/tokens.stylex";
import { Media } from "../primitives/media";
import type { ImageSource } from "../primitives/media";

const styles = stylex.create({
  /*
   * A full-bleed map band with the address card laid over its corner. Below
   * 48rem the card stops floating and stacks under the map instead: an overlay
   * on a 320px-wide map would cover most of the thing it labels.
   */
  band: {
    position: "relative",
    backgroundColor: color.surfaceInverseDeep,
  },
  frame: {
    blockSize: {
      default: "20rem",
      [bp.md]: "min(70vh, 40rem)",
    },
    minBlockSize: "20rem",
  },
  mapEmbed: {
    display: "block",
    inlineSize: "100%",
    blockSize: "100%",
    borderWidth: 0,
  },
  card: {
    backgroundColor: color.surface,
    borderBlockStartWidth: "3px",
    borderBlockStartStyle: "solid",
    borderBlockStartColor: color.accent,
    paddingBlock: space.lg,
    paddingInline: space.gutter,
    position: {
      default: "static",
      [bp.md]: "absolute",
    },
    insetInlineStart: {
      default: "auto",
      [bp.md]: space.gutter,
    },
    insetBlockEnd: {
      default: "auto",
      [bp.md]: space.gutter,
    },
    maxInlineSize: {
      default: "none",
      [bp.md]: "21.5rem",
    },
    boxShadow: {
      default: "none",
      [bp.md]: shadow.md,
    },
  },
  name: {
    margin: 0,
    fontSize: font.sizeSm,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    color: color.onSurface,
  },
  city: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontSize: font.size2xs,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  address: {
    margin: 0,
    marginBlockStart: space.sm,
    fontSize: font.sizeSm,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
  },
  action: {
    display: "inline-flex",
    alignItems: "center",
    minBlockSize: "2.75rem",
    marginBlockStart: space.md,
    paddingInline: space.md,
    backgroundColor: {
      default: color.surfaceInverse,
      ":hover": color.surfaceInverseDeep,
    },
    color: {
      default: color.accentOnInverse,
      ":hover": color.accentHover,
    },
    fontSize: font.sizeXs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    textDecoration: "none",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
    transitionProperty: "background-color, color",
    transitionDuration: motionToken.fast,
  },
});

export interface ContactMapProps {
  address?: string;
  /**
   * External map link, opened by "Get directions". Without it the action is
   * omitted rather than rendered as a dead control.
   */
  mapUrl?: string;
  mapImage?: ImageSource;
  /**
   * An embedded map. Without one the band falls back to the branded
   * placeholder, so the block is never a broken frame.
   */
  mapEmbedUrl?: string;
}

export const ContactMap = ({
  address = CONTACT_DEFAULT_ADDRESS,
  mapUrl,
  mapImage,
  mapEmbedUrl,
}: ContactMapProps) => (
  <section aria-label="Location" {...stylex.props(styles.band)}>
    <div {...stylex.props(styles.frame)}>
      {/*
        The iframe carries a `title`, because an untitled iframe is announced
        only as "frame" and a map is the one thing on this page a screen-reader
        user cannot infer from its surroundings.

        `allow-same-origin` is deliberately absent: combining it with
        `allow-scripts` hands the framed document full access to this origin,
        which the sandbox exists to prevent. The Google Maps embed still
        renders; "Get directions" is the pan-and-zoom path.
      */}
      {mapEmbedUrl ? (
        <iframe
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          sandbox="allow-scripts allow-popups"
          src={mapEmbedUrl}
          title={CONTACT_MAP_TITLE}
          {...stylex.props(styles.mapEmbed)}
        />
      ) : (
        <Media fill placeholder={CONTACT_MAP_PLACEHOLDER} source={mapImage} />
      )}
    </div>
    <div {...stylex.props(styles.card)}>
      <p {...stylex.props(styles.name)}>St. Aloysius&rsquo; College</p>
      <p {...stylex.props(styles.city)}>Galle, Sri Lanka</p>
      <p {...stylex.props(styles.address)}>{address}</p>
      {mapUrl ? (
        <a
          href={mapUrl}
          rel="noopener noreferrer"
          target="_blank"
          {...stylex.props(styles.action)}
        >
          {CONTACT_MAP_LINK_LABEL} &rarr;
        </a>
      ) : null}
    </div>
  </section>
);

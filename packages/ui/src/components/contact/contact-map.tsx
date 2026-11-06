import * as stylex from "@stylexjs/stylex";

import {
  CONTACT_MAP_ADDRESS_LINES,
  CONTACT_MAP_EMBED_URL,
  CONTACT_MAP_LINK_LABEL,
  CONTACT_MAP_TITLE,
  CONTACT_MAP_URL,
} from "../../content/contact";
import { bp } from "../../tokens/breakpoints.stylex";

/*
 * Measurements are the approved design's (Contact.dc.html): a full-bleed map
 * 78vh tall (520-720px) with a cream address card laid over its bottom-left
 * corner. Below 48rem the card stops floating and stacks under the map
 * instead: an overlay on a 320px-wide map would cover most of what it labels.
 */
const styles = stylex.create({
  band: {
    position: "relative",
    backgroundColor: "#062B0A",
  },
  frame: {
    height: {
      default: "20rem",
      [bp.md]: "min(78vh, 720px)",
    },
    minHeight: {
      default: "20rem",
      [bp.md]: "520px",
    },
  },
  mapEmbed: {
    display: "block",
    width: "100%",
    height: "100%",
    borderWidth: 0,
    filter: "saturate(0.85) contrast(1.02)",
  },
  card: {
    backgroundColor: "#FFF8E7",
    borderBlockStartWidth: "3px",
    borderBlockStartStyle: "solid",
    borderBlockStartColor: "#FFB203",
    paddingBlock: "28px",
    paddingInline: "30px",
    maxWidth: {
      default: "none",
      [bp.md]: "340px",
    },
    position: {
      default: "static",
      [bp.md]: "absolute",
    },
    insetInlineStart: {
      default: "auto",
      [bp.md]: "clamp(20px, 4vw, 48px)",
    },
    insetBlockEnd: {
      default: "auto",
      [bp.md]: "clamp(20px, 4vw, 48px)",
    },
    boxShadow: "0 30px 60px -24px rgba(0, 0, 0, 0.45)",
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  crest: {
    height: "42px",
    width: "auto",
  },
  brandText: {
    lineHeight: 1.2,
  },
  name: {
    margin: 0,
    fontWeight: 800,
    fontSize: "13px",
    letterSpacing: "0.05em",
    textTransform: "uppercase",
  },
  city: {
    margin: 0,
    marginBlockStart: "3px",
    fontSize: "10px",
    letterSpacing: "0.22em",
    color: "#A51919",
    textTransform: "uppercase",
  },
  address: {
    margin: 0,
    marginBlockStart: "18px",
    fontSize: "14px",
    lineHeight: 1.65,
    color: "rgba(1, 52, 5, 0.8)",
    fontStyle: "normal",
  },
  action: {
    display: "inline-flex",
    alignItems: "center",
    gap: "10px",
    marginBlockStart: "20px",
    paddingBlock: "12px",
    paddingInline: "20px",
    backgroundColor: {
      default: "#013405",
      ":hover": "#062B0A",
    },
    color: {
      default: "#FFB203",
      ":hover": "#FFD45A",
    },
    fontSize: "12.5px",
    fontWeight: 800,
    letterSpacing: "0.06em",
    textDecoration: "none",
    textTransform: "uppercase",
    whiteSpace: "nowrap",
  },
});

export interface ContactMapProps {
  /** External directions link; the default is Google Maps directions. */
  mapUrl?: string;
  /** The embedded map; the default is the College's Google Maps pin. */
  mapEmbedUrl?: string;
  crestSrc?: string;
}

export const ContactMap = ({
  mapUrl = CONTACT_MAP_URL,
  mapEmbedUrl = CONTACT_MAP_EMBED_URL,
  crestSrc = "/logo.png",
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
      <iframe
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        sandbox="allow-scripts allow-popups"
        src={mapEmbedUrl}
        title={CONTACT_MAP_TITLE}
        {...stylex.props(styles.mapEmbed)}
      />
    </div>
    <div {...stylex.props(styles.card)}>
      <div {...stylex.props(styles.brand)}>
        <img
          alt=""
          aria-hidden="true"
          decoding="async"
          loading="lazy"
          src={crestSrc}
          {...stylex.props(styles.crest)}
        />
        <div {...stylex.props(styles.brandText)}>
          <p {...stylex.props(styles.name)}>St. Aloysius&rsquo; College</p>
          <p {...stylex.props(styles.city)}>Galle, Sri Lanka</p>
        </div>
      </div>
      <address {...stylex.props(styles.address)}>
        {CONTACT_MAP_ADDRESS_LINES.map((line, index) => (
          <span key={line}>
            {index > 0 ? <br /> : null}
            {line}
          </span>
        ))}
      </address>
      <a
        href={mapUrl}
        rel="noopener noreferrer"
        target="_blank"
        {...stylex.props(styles.action)}
      >
        {CONTACT_MAP_LINK_LABEL} &rarr;
      </a>
    </div>
  </section>
);

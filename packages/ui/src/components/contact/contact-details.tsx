import * as stylex from "@stylexjs/stylex";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  CONTACT_DEFAULT_ADDRESS,
  CONTACT_DETAILS_EYEBROW,
  CONTACT_DETAILS_HEADING,
  CONTACT_MAP_LINK_LABEL,
  CONTACT_MAP_PLACEHOLDER,
} from "../../content/contact";
import { bp } from "../../tokens/breakpoints.stylex";
import {
  color,
  font,
  motionToken,
  radius,
  space,
} from "../../tokens/tokens.stylex";
import { Media } from "../primitives/media";
import type { ImageSource } from "../primitives/media";

const styles = stylex.create({
  eyebrow: {
    margin: 0,
    marginBlockEnd: space["2xs"],
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingUltra,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  /*
   * A display heading, matching the form card's masthead opposite it. The two
   * columns are a pair, and a 12px all-caps label on one side against a serif
   * masthead on the other read as two unrelated pieces of page.
   */
  heading: {
    margin: 0,
    marginBlockEnd: space.md,
    fontFamily: font.display,
    fontWeight: font.weightSemibold,
    fontSize: font.size2xl,
    lineHeight: font.leadingSnug,
    letterSpacing: font.trackingTight,
    color: color.onSurface,
    textWrap: "balance",
  },

  /*
   * A description list, not a stack of divs: the label/value pairing is the
   * content's actual structure, so a screen reader announces "Telephone,
   * 091 …" rather than two unrelated lines.
   */
  list: {
    display: "grid",
    margin: 0,
    /*
     * Two columns from 40rem to 64rem. Between those widths the page is still
     * one column, so a single-column detail list would strand a lot of empty
     * space beside four short rows; above 64rem the form moves in alongside and
     * the list goes back to one column.
     */
    gridTemplateColumns: {
      default: "1fr",
      [bp.mdToXl]: "repeat(2, minmax(0, 1fr))",
    },
    columnGap: space.xl,
  },
  row: {
    display: "flex",
    gap: space.sm,
    alignItems: "flex-start",
    paddingBlock: space.md,
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.border,
  },
  /**
   * The icon sits in a tinted square rather than loose beside the text: it gives
   * each row a fixed left edge, so four rows of different lengths still line up.
   */
  iconChip: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    inlineSize: "2.5rem",
    blockSize: "2.5rem",
    backgroundColor: color.surfaceSunken,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.borderAccent,
    borderRadius: radius.md,
    color: color.accentOnSurface,
  },
  rowBody: {
    minWidth: 0,
  },
  label: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.onSurfaceSubtle,
  },
  value: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontSize: font.sizeMd,
    lineHeight: font.leadingNormal,
    color: color.onSurface,
    // Long email addresses must break rather than widen the grid track.
    overflowWrap: "anywhere",
  },
  valueLink: {
    display: "inline-flex",
    alignItems: "center",
    minBlockSize: {
      default: "1.5rem",
      [bp.touch]: "2.75rem",
    },
    color: {
      default: color.onSurface,
      ":hover": color.accentOnSurface,
    },
    textDecoration: "none",
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: {
      default: color.borderStrong,
      ":hover": color.accent,
    },
    transitionProperty: "color, border-color",
    transitionDuration: motionToken.fast,
  },

  map: {
    position: "relative",
    marginBlockStart: space.xl,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
    borderRadius: radius.md,
    overflow: "hidden",
  },
  mapBadge: {
    margin: 0,
    position: "absolute",
    insetInlineStart: space.sm,
    insetBlockEnd: space.sm,
    display: "inline-flex",
    alignItems: "center",
    gap: space["2xs"],
    minBlockSize: "2.75rem",
    paddingInline: space.md,
    backgroundColor: color.surfaceInverse,
    color: color.accentOnInverse,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    textDecoration: "none",
  },
  mapBadgeStatic: {
    // Not a link when no map URL is configured, so it must not look clickable.
    pointerEvents: "none",
  },
});

export interface ContactDetailsProps {
  /** Defaults to the college name and city; street detail comes from the CMS. */
  address?: string;
  telephone?: string;
  email?: string;
  officeHours?: string;
  /** External map link. Without it the map renders as a static placeholder. */
  mapUrl?: string;
  mapImage?: ImageSource;
}

interface Detail {
  id: string;
  label: string;
  value: string;
  Icon: LucideIcon;
  /** `tel:`/`mailto:` target, when the value is actionable. */
  href?: string;
}

/**
 * Strips spaces, brackets and hyphens for the `tel:` target while the visible
 * text keeps whatever formatting the CMS entered. `tel:` with spaces in it is
 * technically invalid and some Android dialers drop the call.
 */
const telHref = (telephone: string) =>
  `tel:${telephone.replaceAll(/[^+\d]/gu, "")}`;

export const ContactDetails = ({
  address = CONTACT_DEFAULT_ADDRESS,
  telephone,
  email,
  officeHours,
  mapUrl,
  mapImage,
}: ContactDetailsProps) => {
  const details: Detail[] = [
    { id: "address", label: "Address", value: address, Icon: MapPin },
  ];
  if (telephone) {
    details.push({
      id: "telephone",
      label: "Telephone",
      value: telephone,
      href: telHref(telephone),
      Icon: Phone,
    });
  }
  if (email) {
    details.push({
      id: "email",
      label: "Email",
      value: email,
      href: `mailto:${email}`,
      Icon: Mail,
    });
  }
  if (officeHours) {
    details.push({
      id: "hours",
      label: "Office hours",
      value: officeHours,
      Icon: Clock,
    });
  }

  return (
    <div>
      <p {...stylex.props(styles.eyebrow)}>{CONTACT_DETAILS_EYEBROW}</p>
      <h2 id="contact-details-title" {...stylex.props(styles.heading)}>
        {CONTACT_DETAILS_HEADING}
      </h2>
      <dl {...stylex.props(styles.list)}>
        {details.map(({ id, label, value, href, Icon }) => (
          <div key={id} {...stylex.props(styles.row)}>
            <span {...stylex.props(styles.iconChip)}>
              <Icon aria-hidden="true" size={18} strokeWidth={1.75} />
            </span>
            <div {...stylex.props(styles.rowBody)}>
              <dt {...stylex.props(styles.label)}>{label}</dt>
              <dd {...stylex.props(styles.value)}>
                {href ? (
                  <a href={href} {...stylex.props(styles.valueLink)}>
                    {value}
                  </a>
                ) : (
                  value
                )}
              </dd>
            </div>
          </div>
        ))}
      </dl>

      <div {...stylex.props(styles.map)}>
        <Media
          placeholder={CONTACT_MAP_PLACEHOLDER}
          ratio="3:2"
          source={mapImage}
        />
        {mapUrl ? (
          <a
            href={mapUrl}
            rel="noopener noreferrer"
            target="_blank"
            {...stylex.props(styles.mapBadge)}
          >
            {CONTACT_MAP_LINK_LABEL}
          </a>
        ) : (
          <p
            aria-hidden="true"
            {...stylex.props(styles.mapBadge, styles.mapBadgeStatic)}
          >
            {CONTACT_MAP_PLACEHOLDER}
          </p>
        )}
      </div>
    </div>
  );
};

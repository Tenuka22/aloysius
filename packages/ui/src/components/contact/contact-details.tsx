import * as stylex from "@stylexjs/stylex";

import { CONTACT_DEFAULT_ADDRESS } from "../../content/contact";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, motionToken, space } from "../../tokens/tokens.stylex";

const styles = stylex.create({
  /*
   * The channel strip that closes the hero: telephone, email, hours and
   * address as four columns divided by a gold hairline. A description list, not
   * a stack of divs - the label/value pairing is the content's actual
   * structure, so a screen reader announces "Telephone, +94 91 …".
   *
   * `auto-fit` with a floor, rather than the mock's fixed four columns, so a
   * detail the CMS has not supplied simply leaves three wider columns instead
   * of an empty one.
   */
  list: {
    display: "grid",
    margin: 0,
    marginBlockStart: space["2xl"],
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.md]: "repeat(auto-fit, minmax(min(100%, 11rem), 1fr))",
    },
    columnGap: space.lg,
    borderBlockStartWidth: space.px,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: "rgba(255, 178, 3, 0.25)",
  },
  row: {
    paddingBlock: space.lg,
    minWidth: 0,
  },
  label: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.accentOnInverse,
  },
  value: {
    margin: 0,
    marginBlockStart: space.xs,
    fontFamily: font.display,
    fontSize: font.sizeXl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
    color: color.onInverse,
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
      default: color.onInverse,
      ":hover": color.accentOnInverse,
    },
    textDecoration: "none",
    transitionProperty: "color",
    transitionDuration: motionToken.fast,
  },
});

export interface ContactDetailsProps {
  /** Defaults to the college name and city; street detail comes from the CMS. */
  address?: string;
  telephone?: string;
  email?: string;
  officeHours?: string;
}

interface Detail {
  id: string;
  label: string;
  value: string;
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
}: ContactDetailsProps) => {
  const details: Detail[] = [];
  if (telephone) {
    details.push({
      id: "telephone",
      label: "Telephone",
      value: telephone,
      href: telHref(telephone),
    });
  }
  if (email) {
    details.push({
      id: "email",
      label: "Email",
      value: email,
      href: `mailto:${email}`,
    });
  }
  if (officeHours) {
    details.push({ id: "hours", label: "Office hours", value: officeHours });
  }
  details.push({ id: "address", label: "Address", value: address });

  return (
    <dl {...stylex.props(styles.list)}>
      {details.map(({ id, label, value, href }) => (
        <div key={id} {...stylex.props(styles.row)}>
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
      ))}
    </dl>
  );
};

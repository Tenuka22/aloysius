import * as stylex from "@stylexjs/stylex";
import {
  Facebook,
  Instagram,
  Mail,
  MapPin,
  Phone,
  Youtube,
} from "lucide-react";

import {
  ADMISSIONS_URL,
  COLLEGE_LOCATION,
  COLLEGE_NAME,
  MOTTO,
  MOTTO_TRANSLATION,
} from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, motionToken, space } from "../../tokens/tokens.stylex";
import { VisuallyHidden } from "../primitives/layout";

const styles = stylex.create({
  footer: {
    backgroundColor: color.surfaceInverseDeep,
    color: color.onInverse,
    borderBlockStartWidth: "2px",
    borderBlockStartStyle: "solid",
    borderBlockStartColor: color.accent,
    paddingInline: space.gutter,
    // Leave room for the home indicator on iOS and for TV safe areas.
    paddingBlockEnd: `max(${space.lg}, env(safe-area-inset-bottom))`,
    paddingBlockStart: space["2xl"],
  },
  inner: {
    marginInline: "auto",
    maxWidth: space.contentWide,
  },
  columns: {
    display: "grid",
    gap: space.xl,
    // One column on a phone, two on a large phone/tablet, four on a laptop.
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.mdToXl]: "repeat(2, minmax(0, 1fr))",
      [bp.xl]: "1.3fr 1fr 1fr 1.2fr",
    },
  },
  brandCol: {
    minWidth: 0,
  },
  crest: {
    height: "5rem",
    width: "auto",
    marginBlockEnd: space.sm,
    objectFit: "contain",
  },
  brandName: {
    margin: 0,
    fontSize: font.sizeLg,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
  },
  brandPlace: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontSize: font.size2xs,
    letterSpacing: font.trackingWidest,
    textTransform: "uppercase",
    color: color.accentOnInverse,
  },
  motto: {
    margin: 0,
    marginBlockStart: space.sm,
    fontFamily: font.display,
    fontStyle: "italic",
    fontSize: font.sizeLg,
    color: color.onInverseSubtle,
  },

  colTitle: {
    margin: 0,
    marginBlockEnd: space.sm,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWidest,
    textTransform: "uppercase",
    color: color.accentOnInverse,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    listStyle: "none",
    margin: 0,
    padding: 0,
  },
  link: {
    display: "inline-flex",
    alignItems: "center",
    // 44px rows: comfortably tappable on a phone and on a smart board.
    minHeight: "2.75rem",
    fontSize: font.sizeSm,
    textDecoration: "none",
    color: {
      default: color.onInverseMuted,
      ":hover": color.accent,
    },
    transitionProperty: "color",
    transitionDuration: motionToken.fast,
  },
  address: {
    // <address> is italic by default in every UA stylesheet.
    fontStyle: "normal",
  },
  contactItem: {
    display: "flex",
    margin: 0,
    alignItems: "flex-start",
    gap: space["2xs"],
    minHeight: "2.75rem",
    paddingBlock: space["3xs"],
    fontSize: font.sizeSm,
    color: color.onInverseMuted,
  },
  contactIcon: {
    flexShrink: 0,
    width: "1rem",
    height: "1rem",
    marginBlockStart: "0.2rem",
    color: color.accentOnInverse,
  },
  contactLink: {
    color: {
      default: color.onInverseMuted,
      ":hover": color.accent,
    },
    textDecoration: "none",
  },

  social: {
    display: "flex",
    gap: space["2xs"],
    listStyle: "none",
    margin: 0,
    marginBlockStart: space.sm,
    padding: 0,
  },
  socialLink: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    width: "2.75rem",
    height: "2.75rem",
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: {
      default: color.borderInverse,
      ":hover": color.accent,
    },
    color: {
      default: color.onInverseMuted,
      ":hover": color.accent,
    },
    transitionProperty: "color, border-color",
    transitionDuration: motionToken.fast,
  },
  socialIcon: {
    width: "1.15rem",
    height: "1.15rem",
  },

  legal: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: space.sm,
    marginBlockStart: space["2xl"],
    paddingBlockStart: space.md,
    borderBlockStartWidth: space.px,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: color.borderInverse,
    fontSize: font.sizeXs,
    color: color.onInverseSubtle,
  },
  legalMotto: {
    letterSpacing: font.trackingWidest,
    textTransform: "uppercase",
  },
});

export interface FooterContact {
  address?: string;
  telephone?: string;
  email?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
}

const EMPTY_CONTACT: FooterContact = {};

const COLLEGE_LINKS = [
  { id: "about", label: "About", href: "/about" },
  { id: "academics", label: "Academics", href: "/academics" },
  { id: "students", label: "Students", href: "/students" },
  { id: "admissions", label: "Admissions", href: ADMISSIONS_URL },
];

const COMMUNITY_LINKS = [
  { id: "news", label: "News & Events", href: "/news" },
  { id: "alumni", label: "Alumni", href: "/alumni" },
  { id: "media", label: "Media", href: "/media" },
  { id: "contact", label: "Contact", href: "/contact" },
];

export const SiteFooter = ({
  contact = EMPTY_CONTACT,
  crestSrc = "/logo.png",
}: {
  contact?: FooterContact;
  crestSrc?: string;
}) => {
  const socials = [
    {
      id: "facebook",
      label: "Facebook",
      href: contact.facebookUrl,
      Icon: Facebook,
    },
    {
      id: "instagram",
      label: "Instagram",
      href: contact.instagramUrl,
      Icon: Instagram,
    },
    {
      id: "youtube",
      label: "YouTube",
      href: contact.youtubeUrl,
      Icon: Youtube,
    },
  ].filter((item): item is typeof item & { href: string } =>
    Boolean(item.href)
  );

  const hasContactDetails = Boolean(
    contact.address || contact.telephone || contact.email
  );

  return (
    <footer {...stylex.props(styles.footer)}>
      <div {...stylex.props(styles.inner)}>
        <div {...stylex.props(styles.columns)}>
          <div {...stylex.props(styles.brandCol)}>
            <img
              alt={`${COLLEGE_NAME} crest`}
              height={80}
              src={crestSrc}
              width={80}
              {...stylex.props(styles.crest)}
            />
            <p {...stylex.props(styles.brandName)}>{COLLEGE_NAME}</p>
            <p {...stylex.props(styles.brandPlace)}>{COLLEGE_LOCATION}</p>
            <p {...stylex.props(styles.motto)}>
              {MOTTO}
              {" - "}
              {MOTTO_TRANSLATION}
            </p>
          </div>

          <nav aria-labelledby="footer-college">
            <h2 id="footer-college" {...stylex.props(styles.colTitle)}>
              College
            </h2>
            <ul {...stylex.props(styles.list)}>
              {COLLEGE_LINKS.map((item) => (
                <li key={item.id}>
                  <a href={item.href} {...stylex.props(styles.link)}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-community">
            <h2 id="footer-community" {...stylex.props(styles.colTitle)}>
              Community
            </h2>
            <ul {...stylex.props(styles.list)}>
              {COMMUNITY_LINKS.map((item) => (
                <li key={item.id}>
                  <a href={item.href} {...stylex.props(styles.link)}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 {...stylex.props(styles.colTitle)}>Contact</h2>
            <address {...stylex.props(styles.address)}>
              {contact.address ? (
                <p {...stylex.props(styles.contactItem)}>
                  <MapPin
                    aria-hidden="true"
                    {...stylex.props(styles.contactIcon)}
                  />
                  {contact.address}
                </p>
              ) : null}
              {contact.telephone ? (
                <p {...stylex.props(styles.contactItem)}>
                  <Phone
                    aria-hidden="true"
                    {...stylex.props(styles.contactIcon)}
                  />
                  <a
                    href={`tel:${contact.telephone.replaceAll(/\s/gu, "")}`}
                    {...stylex.props(styles.contactLink)}
                  >
                    {contact.telephone}
                  </a>
                </p>
              ) : null}
              {contact.email ? (
                <p {...stylex.props(styles.contactItem)}>
                  <Mail
                    aria-hidden="true"
                    {...stylex.props(styles.contactIcon)}
                  />
                  <a
                    href={`mailto:${contact.email}`}
                    {...stylex.props(styles.contactLink)}
                  >
                    {contact.email}
                  </a>
                </p>
              ) : null}
            </address>

            {hasContactDetails ? null : (
              // Until the CMS supplies an address, a link beats an empty column.
              <a href="/contact" {...stylex.props(styles.link)}>
                Contact the college office
              </a>
            )}

            {socials.length > 0 ? (
              <ul {...stylex.props(styles.social)}>
                {socials.map(({ id, label, href, Icon }) => (
                  <li key={id}>
                    <a
                      href={href}
                      rel="noopener noreferrer"
                      target="_blank"
                      {...stylex.props(styles.socialLink)}
                    >
                      <Icon
                        aria-hidden="true"
                        {...stylex.props(styles.socialIcon)}
                      />
                      <VisuallyHidden>{label}</VisuallyHidden>
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </div>

        <div {...stylex.props(styles.legal)}>
          <span>
            &copy; {new Date().getFullYear()} {COLLEGE_NAME}, Galle. All rights
            reserved.
          </span>
          <span {...stylex.props(styles.legalMotto)}>{MOTTO}</span>
        </div>
      </div>
    </footer>
  );
};

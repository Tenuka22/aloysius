import * as stylex from "@stylexjs/stylex";
import { Mail, MapPin, Phone } from "lucide-react";

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

/*
 * Brand marks, inlined rather than imported.
 *
 * `lucide-react` removed its brand icons, so `Facebook`, `Instagram` and
 * `Youtube` are no longer exported and importing them fails the build. The
 * obvious substitutes - a generic camera for Instagram, a play triangle for
 * YouTube - would be a different set of claims than the ones the links make, so
 * the real marks are inlined here instead. They are 24x24, filled with
 * `currentColor` so they inherit the link colour, and take the same props a
 * lucide icon did, so the call site below is unchanged.
 */
interface BrandMarkProps {
  /**
   * Declared because the call site passes it explicitly, and the marks are
   * decorative beside a visually hidden text label.
   */
  "aria-hidden": boolean;
  className?: string;
}

const FacebookMark = ({ className }: BrandMarkProps) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z" />
  </svg>
);

const InstagramMark = ({ className }: BrandMarkProps) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 2.163c3.204 0 3.585.016 4.85.07 1.366.062 2.633.336 3.608 1.311.975.975 1.249 2.242 1.311 3.608.055 1.265.07 1.646.07 4.85s-.015 3.585-.07 4.85c-.062 1.366-.336 2.633-1.311 3.608-.975.975-2.242 1.249-3.608 1.311-1.265.055-1.646.07-4.85.07s-3.585-.015-4.85-.07c-1.366-.062-2.633-.336-3.608-1.311-.975-.975-1.249-2.242-1.311-3.608C2.176 15.585 2.16 15.204 2.16 12s.015-3.585.07-4.85c.062-1.366.336-2.633 1.311-3.608.975-.975 2.242-1.249 3.608-1.311C8.415 2.178 8.796 2.163 12 2.163Zm0 5.678a4.159 4.159 0 1 0 0 8.318 4.159 4.159 0 0 0 0-8.318Zm0 6.865a2.706 2.706 0 1 1 0-5.412 2.706 2.706 0 0 1 0 5.412Zm5.291-7.032a.973.973 0 1 1-1.946 0 .973.973 0 0 1 1.946 0Z" />
  </svg>
);

const YoutubeMark = ({ className }: BrandMarkProps) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="currentColor"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814ZM9.545 15.568V8.432L15.818 12l-6.273 3.568Z" />
  </svg>
);

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
      Icon: FacebookMark,
    },
    {
      id: "instagram",
      label: "Instagram",
      href: contact.instagramUrl,
      Icon: InstagramMark,
    },
    {
      id: "youtube",
      label: "YouTube",
      href: contact.youtubeUrl,
      Icon: YoutubeMark,
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
                        aria-hidden={true}
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

import * as stylex from "@stylexjs/stylex";
import { Mail, MapPin, Phone } from "lucide-react";

import {
  ADMISSIONS_URL,
  COLLEGE_LOCATION,
  COLLEGE_NAME,
  FOUNDED_YEAR,
  MOTTO,
  MOTTO_TRANSLATION,
} from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import {
  color,
  font,
  motionToken,
  radius,
  space,
} from "../../tokens/tokens.stylex";
import { ButtonLink } from "../primitives/button";
import { VisuallyHidden } from "../primitives/layout";
import { Media } from "../primitives/media";
import type { ImageSource } from "../primitives/media";

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
/**
 * Whether a nav destination leaves the site.
 *
 * The footer's Admissions link points at the college's admissions subdomain, so
 * it opens in a new tab and carries `rel="noopener noreferrer"` - without which
 * that destination can reach back through `window.opener`. Checked per link
 * rather than flagged on the one entry, so an in-app destination is never given
 * a target it does not need.
 */
const EXTERNAL_LINK = /^https?:\/\//u;

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
    backgroundColor: color.surfaceSunken,
    color: color.onSurface,
  },

  /* ------------------------------------------------------------ visit band */
  visit: {
    position: "relative",
    overflow: "hidden",
    // Fluid, like the design's clamp(260px, 34vw, 420px); in rem so the 4K
    // root-size scaling carries it along.
    minBlockSize: "clamp(16rem, 34vw, 26rem)",
    display: "flex",
    alignItems: "center",
    backgroundColor: color.surfaceInverse,
    color: color.onInverse,
    paddingInline: space.gutter,
  },
  visitPhoto: {
    position: "absolute",
    inset: 0,
    inlineSize: "100%",
    blockSize: "100%",
  },
  visitScrim: {
    position: "absolute",
    inset: 0,
    backgroundImage:
      "linear-gradient(90deg, rgba(1,52,5,0.92) 0%, rgba(1,52,5,0.55) 55%, rgba(1,52,5,0.15) 100%)",
    pointerEvents: "none",
  },
  visitWatermark: {
    position: "absolute",
    insetInlineEnd: "-4rem",
    insetBlockEnd: "-6rem",
    blockSize: "26rem",
    inlineSize: "auto",
    opacity: 0.07,
    pointerEvents: "none",
  },
  visitInner: {
    position: "relative",
    inlineSize: "100%",
    maxWidth: space.content,
    marginInline: "auto",
    paddingBlock: space["2xl"],
  },
  visitEyebrow: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingUltra,
    textTransform: "uppercase",
    color: color.accentOnInverse,
  },
  visitTitle: {
    margin: 0,
    marginBlockStart: space.sm,
    fontFamily: font.display,
    fontWeight: font.weightSemibold,
    fontSize: "clamp(2.375rem, 1.5rem + 3.4vw, 4rem)",
    lineHeight: font.leadingTight,
    textWrap: "balance",
  },
  visitAccent: {
    fontWeight: font.weightMedium,
    color: color.accentOnInverse,
  },
  visitActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.xs,
    marginBlockStart: space.lg,
  },

  /* ------------------------------------------------------------ body */
  body: {
    paddingInline: space.gutter,
  },
  inner: {
    marginInline: "auto",
    maxWidth: space.content,
  },
  brandRow: {
    display: "grid",
    alignItems: "center",
    gap: `${space.lg} ${space.xl}`,
    paddingBlockStart: space["2xl"],
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.xl]: "repeat(2, minmax(0, 1fr))",
    },
  },
  brand: {
    display: "flex",
    alignItems: "center",
    gap: space.md,
    minWidth: 0,
  },
  crest: {
    flexShrink: 0,
    blockSize: "clamp(4.5rem, 3rem + 4vw, 6.5rem)",
    inlineSize: "auto",
    objectFit: "contain",
  },
  brandText: {
    minWidth: 0,
    paddingInlineStart: space.md,
    borderInlineStartWidth: space.px,
    borderInlineStartStyle: "solid",
    borderInlineStartColor: color.borderStrong,
  },
  brandName: {
    margin: 0,
    fontFamily: font.display,
    fontWeight: font.weightSemibold,
    fontSize: "clamp(1.75rem, 1.4rem + 1.4vw, 2.5rem)",
    lineHeight: font.leadingTight,
  },
  brandPlace: {
    margin: 0,
    marginBlockStart: space.xs,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWidest,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  mottoBlock: {
    display: "flex",
    flexDirection: "column",
    gap: space["3xs"],
    minWidth: 0,
  },
  motto: {
    margin: 0,
    fontFamily: font.display,
    fontStyle: "italic",
    fontWeight: font.weightMedium,
    fontSize: "clamp(1.625rem, 1.3rem + 1.2vw, 2.125rem)",
    lineHeight: font.leadingSnug,
  },
  mottoNote: {
    margin: 0,
    maxWidth: "46ch",
    fontSize: font.sizeSm,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
  },

  columns: {
    display: "grid",
    gap: `${space.xl} ${space.md}`,
    marginBlockStart: space["2xl"],
    paddingBlock: space["2xl"],
    borderBlockStartWidth: space.px,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: color.border,
    // One column on a phone, two from a large phone, four on a laptop.
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.sm]: "repeat(2, minmax(0, 1fr))",
      [bp.xl]: "repeat(4, minmax(0, 1fr))",
    },
  },
  colTitle: {
    margin: 0,
    marginBlockEnd: space.sm,
    fontFamily: font.display,
    fontStyle: "italic",
    fontWeight: font.weightSemibold,
    fontSize: font.sizeXl,
    color: color.accentOnSurface,
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
    // 44px rows on touch screens and smart boards, a tighter 28px with a mouse.
    minBlockSize: {
      default: "2.75rem",
      [bp.hover]: "1.75rem",
    },
    fontSize: font.sizeSm,
    fontWeight: font.weightMedium,
    textDecoration: "none",
    color: {
      default: color.onSurface,
      ":hover": color.accentOnSurface,
    },
    transitionProperty: "color",
    transitionDuration: motionToken.fast,
  },
  address: {
    // <address> is italic by default in every UA stylesheet.
    fontStyle: "normal",
    display: "flex",
    flexDirection: "column",
  },
  contactItem: {
    display: "flex",
    margin: 0,
    alignItems: "flex-start",
    gap: space["2xs"],
    paddingBlock: space["3xs"],
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
  },
  contactIcon: {
    flexShrink: 0,
    width: "1rem",
    height: "1rem",
    marginBlockStart: "0.2rem",
    color: color.accentOnSurface,
  },
  contactLink: {
    // WCAG 2.2 SC 2.5.8: a bare 14px inline link is a ~19px target.
    display: "inline-flex",
    alignItems: "center",
    minBlockSize: "1.5rem",
    overflowWrap: "anywhere",
    color: {
      default: color.onSurfaceMuted,
      ":hover": color.accentOnSurface,
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
    borderRadius: radius.circle,
    backgroundColor: {
      default: color.surfaceInverse,
      ":hover": color.danger,
    },
    color: color.onInverse,
    transitionProperty: "background-color",
    transitionDuration: motionToken.fast,
  },
  socialIcon: {
    width: "1.05rem",
    height: "1.05rem",
  },

  /* ------------------------------------------------------------ legal bar */
  legal: {
    backgroundColor: color.surfaceInverse,
    color: color.onInverseMuted,
    borderBlockStartWidth: "3px",
    borderBlockStartStyle: "solid",
    borderBlockStartColor: color.accent,
    paddingInline: space.gutter,
    // Leave room for the home indicator on iOS and for TV safe areas.
    paddingBlockEnd: "env(safe-area-inset-bottom)",
  },
  legalInner: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "space-between",
    gap: `${space.xs} ${space.lg}`,
    marginInline: "auto",
    maxWidth: space.content,
    paddingBlock: space.md,
    fontSize: font.sizeXs,
  },
  backToTop: {
    display: "inline-flex",
    alignItems: "center",
    minBlockSize: "1.5rem",
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    textDecoration: "none",
    textTransform: "uppercase",
    color: {
      default: color.accentOnInverse,
      ":hover": color.accentHover,
    },
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

interface FooterLink {
  id: string;
  label: string;
  href: string;
}

const COLLEGE_LINKS: readonly FooterLink[] = [
  { id: "heritage", label: "Our Heritage", href: "/about#history" },
  { id: "vision", label: "Vision & Mission", href: "/about#vision" },
  { id: "principal", label: "Principal's Message", href: "/about#principal" },
  {
    id: "administration",
    label: "Administration",
    href: "/about#administration",
  },
];

const LEARNING_LINKS: readonly FooterLink[] = [
  { id: "academics", label: "Academics", href: "/academics" },
  { id: "results", label: "Examination Results", href: "/results" },
  { id: "facilities", label: "Facilities", href: "/academics#facilities" },
  { id: "admissions", label: "Admissions", href: ADMISSIONS_URL },
];

const COMMUNITY_LINKS: readonly FooterLink[] = [
  { id: "students", label: "Student Life", href: "/students" },
  { id: "news", label: "News & Events", href: "/news" },
  { id: "alumni", label: "Old Boys' Association", href: "/alumni" },
  { id: "media", label: "Gallery", href: "/media" },
];

const LinkColumn = ({
  id,
  title,
  links,
}: {
  id: string;
  title: string;
  links: readonly FooterLink[];
}) => (
  <nav aria-labelledby={id}>
    <h2 id={id} {...stylex.props(styles.colTitle)}>
      {title}
    </h2>
    <ul {...stylex.props(styles.list)}>
      {links.map((item) => {
        const external = EXTERNAL_LINK.test(item.href);
        return (
          <li key={item.id}>
            <a
              href={item.href}
              rel={external ? "noopener noreferrer" : undefined}
              target={external ? "_blank" : undefined}
              {...stylex.props(styles.link)}
            >
              {item.label}
            </a>
          </li>
        );
      })}
    </ul>
  </nav>
);

export const SiteFooter = ({
  contact = EMPTY_CONTACT,
  crestSrc = "/logo.png",
  visitImage,
}: {
  contact?: FooterContact;
  crestSrc?: string;
  /** Wide photograph of the College for the "Visit" band; a crest watermark stands in until it is supplied. */
  visitImage?: ImageSource;
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
      <div {...stylex.props(styles.visit)}>
        {visitImage ? (
          <>
            <Media
              fill
              placeholder=""
              source={visitImage}
              style={styles.visitPhoto}
            />
            <div aria-hidden="true" {...stylex.props(styles.visitScrim)} />
          </>
        ) : (
          <img
            alt=""
            aria-hidden="true"
            decoding="async"
            loading="lazy"
            src={crestSrc}
            {...stylex.props(styles.visitWatermark)}
          />
        )}
        <div {...stylex.props(styles.visitInner)}>
          <p {...stylex.props(styles.visitEyebrow)}>Visit the College</p>
          <h2 {...stylex.props(styles.visitTitle)}>
            Come and see
            <br />
            <em {...stylex.props(styles.visitAccent)}>Aloysian life.</em>
          </h2>
          <div {...stylex.props(styles.visitActions)}>
            <ButtonLink href="/contact">Plan a visit</ButtonLink>
            <ButtonLink external href={ADMISSIONS_URL} variant="outlineInverse">
              Admissions
            </ButtonLink>
          </div>
        </div>
      </div>

      <div {...stylex.props(styles.body)}>
        <div {...stylex.props(styles.inner)}>
          <div {...stylex.props(styles.brandRow)}>
            <div {...stylex.props(styles.brand)}>
              <img
                alt={`${COLLEGE_NAME} crest`}
                height={104}
                src={crestSrc}
                width={104}
                {...stylex.props(styles.crest)}
              />
              <div {...stylex.props(styles.brandText)}>
                <p {...stylex.props(styles.brandName)}>{COLLEGE_NAME}, Galle</p>
                <p {...stylex.props(styles.brandPlace)}>
                  Est. {FOUNDED_YEAR} &middot; Sri Lanka
                </p>
              </div>
            </div>
            <div {...stylex.props(styles.mottoBlock)}>
              <p {...stylex.props(styles.motto)}>&ldquo;{MOTTO}&rdquo;</p>
              <p {...stylex.props(styles.mottoNote)}>
                {MOTTO_TRANSLATION} &mdash; forming young men of faith,
                discipline and excellence in the heart of {COLLEGE_LOCATION}.
              </p>
            </div>
          </div>

          <div {...stylex.props(styles.columns)}>
            <LinkColumn
              id="footer-college"
              links={COLLEGE_LINKS}
              title="The College"
            />
            <LinkColumn
              id="footer-learning"
              links={LEARNING_LINKS}
              title="Learning"
            />
            <LinkColumn
              id="footer-community"
              links={COMMUNITY_LINKS}
              title="Community"
            />

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
        </div>
      </div>

      <div {...stylex.props(styles.legal)}>
        <div {...stylex.props(styles.legalInner)}>
          <span>
            &copy; {new Date().getFullYear()} {COLLEGE_NAME}, Galle. All rights
            reserved.
          </span>
          <a href="#top" {...stylex.props(styles.backToTop)}>
            Back to top <span aria-hidden="true">&nbsp;&uarr;</span>
          </a>
        </div>
      </div>
    </footer>
  );
};

import * as stylex from "@stylexjs/stylex";

import type { NavItem } from "../../content/home";
import { color, font, space } from "../../tokens/tokens.stylex";
import { SiteFooter } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";

const MAIN_ID = "main-content";

const styles = stylex.create({
  main: {
    display: "block",
    outline: {
      default: null,
      ":focus": "none",
    },
  },
  hero: {
    paddingBlockStart: space["3xl"],
    paddingBlockEnd: space.xl,
    paddingInline: space.md,
    backgroundColor: color.surface,
    textAlign: "center",
  },
  eyebrow: {
    margin: 0,
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWidest,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  heading: {
    margin: 0,
    marginBlockStart: space.sm,
    fontFamily: font.display,
    fontSize: font.size4xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    color: color.onSurface,
  },
  tagline: {
    margin: 0,
    marginBlockStart: space.sm,
    maxWidth: space.measure,
    marginInline: "auto",
    fontSize: font.sizeLg,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  content: {
    paddingBlock: space.xl,
    paddingInline: space.md,
    maxWidth: space.measure,
    marginInline: "auto",
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: space.lg,
  },
  infoBlock: {
    padding: space.lg,
    borderRadius: space.sm,
    backgroundColor: color.surfaceRaised,
  },
  infoLabel: {
    margin: 0,
    fontSize: font.sizeSm,
    fontWeight: font.weightMedium,
    color: color.onSurfaceMuted,
  },
  infoValue: {
    margin: 0,
    marginBlockStart: space.xs,
    fontSize: font.sizeLg,
    fontWeight: font.weightMedium,
    color: color.onSurface,
  },
});

export interface ContactPageProps {
  eyebrow?: string;
  heading?: string;
  tagline?: string;
  address?: string;
  telephone?: string;
  email?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  youtubeUrl?: string;
  mapUrl?: string;
  extraNavItems?: readonly NavItem[];
}

export const ContactPage = ({
  eyebrow,
  heading = "Contact Us",
  tagline,
  address,
  telephone,
  email,
  extraNavItems,
}: ContactPageProps) => (
  <>
    <SiteHeader activeHref="/contact" extraNavItems={extraNavItems} />
    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      <section {...stylex.props(styles.hero)}>
        {eyebrow && <p {...stylex.props(styles.eyebrow)}>{eyebrow}</p>}
        <h1 {...stylex.props(styles.heading)}>{heading}</h1>
        {tagline && <p {...stylex.props(styles.tagline)}>{tagline}</p>}
      </section>
      <section {...stylex.props(styles.content)}>
        {address && (
          <div {...stylex.props(styles.infoBlock)}>
            <p {...stylex.props(styles.infoLabel)}>Address</p>
            <p {...stylex.props(styles.infoValue)}>{address}</p>
          </div>
        )}
        {telephone && (
          <div {...stylex.props(styles.infoBlock)}>
            <p {...stylex.props(styles.infoLabel)}>Telephone</p>
            <p {...stylex.props(styles.infoValue)}>{telephone}</p>
          </div>
        )}
        {email && (
          <div {...stylex.props(styles.infoBlock)}>
            <p {...stylex.props(styles.infoLabel)}>Email</p>
            <p {...stylex.props(styles.infoValue)}>{email}</p>
          </div>
        )}
      </section>
    </main>
    <SiteFooter />
  </>
);

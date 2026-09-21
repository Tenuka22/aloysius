import * as stylex from "@stylexjs/stylex";

import type { NavItem } from "../../content/home";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Media } from "../primitives/media";
import type { ImageSource } from "../primitives/media";
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
  heroMedia: {
    marginBlockStart: space.lg,
  },
  contentMedia: {
    marginBlockStart: space.lg,
  },
  content: {
    paddingBlock: space.xl,
    paddingInline: space.md,
    maxWidth: space.measure,
    marginInline: "auto",
  },
  body: {
    margin: 0,
    fontSize: font.sizeLg,
    lineHeight: font.leadingRelaxed,
    color: color.onSurface,
  },
  quickLinks: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.sm,
    marginBlockStart: space.lg,
  },
  quickLink: {
    display: "inline-flex",
    alignItems: "center",
    padding: space.sm,
    paddingLeft: space.md,
    paddingRight: space.md,
    borderRadius: space.sm,
    backgroundColor: color.accentOnSurface,
    color: color.surface,
    textDecoration: "none",
    fontSize: font.sizeSm,
    fontWeight: font.weightMedium,
    transition: "opacity 0.2s",
  },
});

export interface AlumniPageProps {
  eyebrow?: string;
  heading?: string;
  tagline?: string;
  heroImage?: ImageSource;
  body?: string;
  image?: ImageSource;
  obaHref?: string;
  eventsHref?: string;
  extraNavItems?: readonly NavItem[];
}

export const AlumniPage = ({
  eyebrow,
  heading = "Alumni",
  tagline,
  heroImage,
  body,
  image,
  obaHref,
  eventsHref,
  extraNavItems,
}: AlumniPageProps) => (
  <>
    <SiteHeader activeHref="/alumni" extraNavItems={extraNavItems} />
    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      <section {...stylex.props(styles.hero)}>
        {eyebrow && <p {...stylex.props(styles.eyebrow)}>{eyebrow}</p>}
        <h1 {...stylex.props(styles.heading)}>{heading}</h1>
        {tagline && <p {...stylex.props(styles.tagline)}>{tagline}</p>}
        {heroImage && (
          <Media
            placeholder=""
            ratio="16:9"
            source={heroImage}
            style={styles.heroMedia}
          />
        )}
      </section>
      <section {...stylex.props(styles.content)}>
        {body && <p {...stylex.props(styles.body)}>{body}</p>}
        {image && (
          <Media
            placeholder="Old Boys' Association"
            ratio="3:2"
            source={image}
            style={styles.contentMedia}
          />
        )}
        {(obaHref || eventsHref) && (
          <div {...stylex.props(styles.quickLinks)}>
            {obaHref && (
              <a
                href={obaHref}
                target="_blank"
                rel="noopener noreferrer"
                {...stylex.props(styles.quickLink)}
              >
                OBA Portal
              </a>
            )}
            {eventsHref && (
              <a
                href={eventsHref}
                target="_blank"
                rel="noopener noreferrer"
                {...stylex.props(styles.quickLink)}
              >
                Events
              </a>
            )}
          </div>
        )}
      </section>
    </main>
    <SiteFooter />
  </>
);

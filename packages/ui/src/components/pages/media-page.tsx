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
  content: {
    paddingBlock: space.xl,
    paddingInline: space.md,
    maxWidth: space.measure,
    marginInline: "auto",
  },
});

export interface MediaPageProps {
  eyebrow?: string;
  heading?: string;
  tagline?: string;
  heroImage?: ImageSource;
  galleryCount?: number;
  extraNavItems?: readonly NavItem[];
}

export const MediaPage = ({
  eyebrow,
  heading = "Media Gallery",
  tagline,
  heroImage,
  galleryCount,
  extraNavItems,
}: MediaPageProps) => (
  <>
    <SiteHeader activeHref="/media" extraNavItems={extraNavItems} />
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
        <p>
          Media gallery will be displayed here once published.
          {galleryCount ? ` Showing ${galleryCount} items per page.` : ""}
        </p>
      </section>
    </main>
    <SiteFooter />
  </>
);

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
  /**
   * Unused. It only ever printed "Showing N items per page" inside the
   * placeholder text, and the galleries that number refers to are rendered on
   * the /galleries route rather than here.
   */
  galleryCount?: never;
  extraNavItems?: readonly NavItem[];
}

export const MediaPage = ({
  eyebrow,
  heading = "Media Gallery",
  tagline,
  heroImage,
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
      {/*
       * The galleries themselves come from `club.listApprovedGalleries` on the
       * route, not from these props. This section used to render "Media gallery
       * will be displayed here once published" unconditionally - a placeholder
       * shown even when galleries existed below it, because the gallery strip
       * lives on the /galleries route rather than here.
       */}
      <section {...stylex.props(styles.content)}>
        <p {...stylex.props(styles.eyebrow)}>Gallery</p>
        <h2 {...stylex.props(styles.heading)}>Photographs &amp; Videos</h2>
        <p>
          Every image here is uploaded and captioned by the College. Browse the
          full gallery, filtered by year and category, from the Galleries page.
        </p>
      </section>
    </main>
    <SiteFooter />
  </>
);

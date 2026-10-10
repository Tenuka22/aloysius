import * as stylex from "@stylexjs/stylex";

import type { NavItem } from "../../content/home";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Media } from "../primitives/media";
import type { ImageSource } from "../primitives/media";
import { SiteFooter } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";

const MAIN_ID = "main-content";
/** Module-level so the default is referentially stable across renders. */
const NO_GALLERIES: readonly MediaGalleryTile[] = [];

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
  emptyBody: {
    margin: 0,
    fontSize: font.sizeSm,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  galleryList: {
    display: "grid",
    gridTemplateColumns: {
      default: "1fr",
      "@media (min-width: 40rem)": "repeat(2, 1fr)",
      "@media (min-width: 64rem)": "repeat(3, 1fr)",
    },
    gap: space.lg,
    margin: 0,
    padding: 0,
    listStyle: "none",
  },
  galleryItem: {
    minWidth: 0,
  },
  galleryLink: {
    display: "block",
    color: "inherit",
    textDecoration: "none",
  },
  galleryMedia: {
    marginBlockEnd: space.sm,
  },
  galleryTitle: {
    display: "block",
    fontFamily: font.display,
    fontSize: font.sizeLg,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    color: color.onSurface,
  },
});

export interface MediaPageProps {
  eyebrow?: string;
  heading?: string;
  tagline?: string;
  heroImage?: ImageSource;
  /**
   * One tile per approved gallery. The page used to render a hero and two lines
   * of copy with no images at all, because the route never asked for a gallery.
   */
  galleries?: readonly MediaGalleryTile[];
  extraNavItems?: readonly NavItem[];
}

export interface MediaGalleryTile {
  id: string;
  title: string;
  href: string;
  image: ImageSource;
}

export const MediaPage = ({
  eyebrow,
  heading = "Media Gallery",
  tagline,
  heroImage,
  galleries = NO_GALLERIES,
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
       * The gallery grid. This page rendered a hero and two lines of copy with
       * no images at all: it used to print "Media gallery will be displayed here
       * once published", and when that placeholder was replaced the section
       * simply went empty, because nothing on the route had ever asked for a
       * gallery. `galleries` comes from `club.listApprovedGalleries`, so what is
       * shown is whatever a CMS reviewer has approved - never stock imagery.
       */}
      <section {...stylex.props(styles.content)}>
        <p {...stylex.props(styles.eyebrow)}>Gallery</p>
        <h2 {...stylex.props(styles.heading)}>Photographs &amp; Videos</h2>
        {galleries.length === 0 ? (
          <p {...stylex.props(styles.emptyBody)}>
            No galleries have been published yet. Approved galleries appear here
            as soon as the CMS team reviews them.
          </p>
        ) : (
          <ul {...stylex.props(styles.galleryList)}>
            {galleries.map((gallery) => (
              <li key={gallery.id} {...stylex.props(styles.galleryItem)}>
                <a href={gallery.href} {...stylex.props(styles.galleryLink)}>
                  <Media
                    placeholder=""
                    ratio="4:3"
                    source={gallery.image}
                    style={styles.galleryMedia}
                  />
                  <span {...stylex.props(styles.galleryTitle)}>
                    {gallery.title}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
    <SiteFooter />
  </>
);

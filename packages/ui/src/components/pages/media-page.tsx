import * as stylex from "@stylexjs/stylex";

import type { NavItem } from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Container, SkipLink } from "../primitives/layout";
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
  /*
   * A compact left-aligned masthead. It was a centred `4xl` block with an eyebrow
   * above it, so on a page whose subject is photographs and video the title was
   * the loudest thing on the screen.
   */
  hero: {
    paddingBlock: space["2xl"],
    paddingInline: space.gutter,
    backgroundColor: color.surface,
  },
  heading: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.size3xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingTight,
    letterSpacing: font.trackingTight,
    color: color.onSurface,
    textWrap: "balance",
  },
  tagline: {
    margin: 0,
    marginBlockStart: space["2xs"],
    maxInlineSize: space.measure,
    fontSize: font.sizeLg,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  heroMedia: {
    marginBlockStart: space.lg,
  },
  content: {
    paddingBlock: space.xl,
    paddingInline: space.gutter,
  },
  /* The section heading below the masthead. Two steps under the `h1`, which is
   * what makes the hierarchy readable rather than two headings at one size. */
  sectionHeading: {
    margin: 0,
    fontFamily: font.display,
    fontSize: font.size2xl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
    color: color.onSurface,
    textWrap: "balance",
  },
  sectionIntro: {
    margin: 0,
    marginBlockStart: space["2xs"],
    maxInlineSize: space.measure,
    fontSize: font.sizeMd,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  emptyBody: {
    margin: 0,
    fontSize: font.sizeSm,
    lineHeight: font.leadingRelaxed,
    color: color.onSurfaceMuted,
    textWrap: "pretty",
  },
  /*
   * Every gallery cover is cropped to a 1:1 square at upload time
   * (`ratioKey="galleryThumb"`), so there is no real per-photo aspect ratio to
   * lay out a true Pinterest masonry from - every source image is the same
   * shape. The mosaic rhythm instead comes from deliberate tile spans, the
   * same technique the Students sports bento uses: a repeating 6-tile pattern
   * (feature, tall, wide, three plain) rather than a uniform grid of
   * identical cards. The pattern repeats by `index % 6`, so it holds for any
   * gallery count and never depends on which galleries happen to exist.
   */
  galleryList: {
    display: "grid",
    margin: 0,
    marginBlockStart: space["2xl"],
    padding: 0,
    listStyle: "none",
    gap: space.lg,
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.mdToXl]: "repeat(2, minmax(0, 1fr))",
      [bp.xl]: "repeat(4, minmax(0, 1fr))",
    },
    gridAutoRows: {
      default: "auto",
      [bp.xl]: "minmax(9rem, auto)",
    },
  },
  galleryItem: {
    position: "relative",
    display: "flex",
    minWidth: 0,
    overflow: "hidden",
    minBlockSize: {
      default: "14rem",
      [bp.xl]: "auto",
    },
  },
  /** Every 6th tile (feature): a 2x2 block, the mosaic's anchor. */
  spanFeature: {
    gridColumn: { default: "auto", [bp.xl]: "span 2" },
    gridRow: { default: "auto", [bp.xl]: "span 2" },
  },
  /** The tile after a feature: a tall 1x2 portrait block. */
  spanTall: {
    gridRow: { default: "auto", [bp.xl]: "span 2" },
  },
  /** The last tile of each cycle: a wide 2x1 banner block. */
  spanWide: {
    gridColumn: { default: "auto", [bp.xl]: "span 2" },
  },
  galleryLink: {
    display: "block",
    position: "relative",
    inlineSize: "100%",
    blockSize: "100%",
    color: "inherit",
    textDecoration: "none",
  },
  galleryMedia: {
    blockSize: "100%",
  },
  /*
   * The caption sits on a scrim over the photograph rather than below it:
   * a mosaic tile's box is the shape the layout gives it, not a fixed ratio
   * the title's own line-height could reliably sit under.
   */
  galleryScrim: {
    position: "absolute",
    insetInline: 0,
    insetBlockEnd: 0,
    paddingBlock: space.md,
    paddingInline: space.md,
    backgroundImage:
      "linear-gradient(to top, rgba(1, 52, 5, 0.75), rgba(1, 52, 5, 0))",
  },
  galleryTitle: {
    display: "block",
    margin: 0,
    fontFamily: font.display,
    fontSize: font.sizeMd,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
    color: color.onInverse,
    textWrap: "balance",
  },
});

export interface MediaPageProps {
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

/** `index % 6` picks a span for each tile; see `galleryList`'s comment. */
const MOSAIC_PATTERN = [
  "feature",
  "plain",
  "tall",
  "plain",
  "plain",
  "wide",
] as const;

const MOSAIC_SPAN_STYLES = {
  feature: styles.spanFeature,
  plain: undefined,
  tall: styles.spanTall,
  wide: styles.spanWide,
} as const;

export const MediaPage = ({
  heading = "Media Gallery",
  tagline,
  heroImage,
  galleries = NO_GALLERIES,
  extraNavItems,
}: MediaPageProps) => (
  <>
    <SkipLink targetId={MAIN_ID} />
    <SiteHeader activeHref="/media" extraNavItems={extraNavItems} />
    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      <section {...stylex.props(styles.hero)}>
        <Container>
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
        </Container>
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
        <Container width="wide">
          <h2 {...stylex.props(styles.sectionHeading)}>
            Photographs &amp; Videos
          </h2>
          {galleries.length === 0 ? (
            <p {...stylex.props(styles.emptyBody)}>
              No galleries have been published yet. Approved galleries appear
              here as soon as the CMS team reviews them.
            </p>
          ) : (
            <ul {...stylex.props(styles.galleryList)}>
              {galleries.map((gallery, index) => {
                const span =
                  MOSAIC_PATTERN[index % MOSAIC_PATTERN.length] ?? "plain";
                return (
                  <li
                    key={gallery.id}
                    {...stylex.props(
                      styles.galleryItem,
                      MOSAIC_SPAN_STYLES[span]
                    )}
                  >
                    <a
                      href={gallery.href}
                      {...stylex.props(styles.galleryLink)}
                    >
                      <Media
                        fill
                        placeholder=""
                        source={gallery.image}
                        style={styles.galleryMedia}
                        zoom
                      />
                      <div {...stylex.props(styles.galleryScrim)}>
                        <span {...stylex.props(styles.galleryTitle)}>
                          {gallery.title}
                        </span>
                      </div>
                    </a>
                  </li>
                );
              })}
            </ul>
          )}
        </Container>
      </section>
    </main>
    <SiteFooter />
  </>
);

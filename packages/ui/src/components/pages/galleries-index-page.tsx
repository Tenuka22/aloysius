import * as stylex from "@stylexjs/stylex";

import type { GalleriesPageProps } from "../../content/cms-to-pages";
import {
  GALLERIES_HERO_INTRO,
  GALLERIES_HERO_TITLE,
} from "../../content/galleries";
import type { NavItem } from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Container, Section, SkipLink } from "../primitives/layout";
import { Media } from "../primitives/media";
import { SiteFooter } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";

/**
 * Every published gallery, in one place.
 *
 * There is no club landing page anymore - a club's content is its galleries,
 * so this is the index of them: one card per approved gallery, linking to its
 * own `/galleries/<slug>`. Ungated for the same reason an individual gallery
 * page is: a row only exists here once a CMS reviewer has approved it.
 */

const MAIN_ID = "main-content";

export interface GalleriesIndexItem {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  photoCount: number;
}

export interface GalleriesIndexPageProps {
  galleries: readonly GalleriesIndexItem[];
  extraNavItems?: readonly NavItem[];
  /** The `galleries-header` CMS block, resolved by the route. */
  header?: GalleriesPageProps;
}

const styles = stylex.create({
  main: {
    display: "block",
    outline: {
      default: null,
      ":focus": "none",
    },
  },
  /*
   * A compact left-aligned masthead, matching the gallery detail page and the
   * news archive. It was a centred block at `4xl`, which on an index of
   * photographs meant the title was the loudest thing on the page when the
   * photographs were supposed to be.
   */
  header: {
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
  eyebrow: {
    margin: 0,
    marginBlockEnd: space.xs,
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  heroMedia: {
    marginBlockStart: space.xl,
  },
  empty: {
    margin: 0,
    fontSize: font.sizeSm,
    color: color.onSurfaceMuted,
  },
  grid: {
    display: "grid",
    gap: space.lg,
    margin: 0,
    padding: 0,
    listStyle: "none",
    gridTemplateColumns: {
      default: "1fr",
      [bp.md]: "repeat(2, 1fr)",
      [bp.xl]: "repeat(3, 1fr)",
    },
  },
  card: {
    display: "block",
  },
  cardTitle: {
    margin: 0,
    marginBlockStart: space.sm,
    fontFamily: font.display,
    fontSize: font.sizeXl,
    fontWeight: font.weightSemibold,
    color: color.onSurface,
  },
  cardDescription: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
  },
  cardCount: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontSize: font.sizeXs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
});

export const GalleriesIndexPage = ({
  galleries,
  extraNavItems,
  header,
}: GalleriesIndexPageProps) => (
  <>
    <SkipLink targetId={MAIN_ID} />
    <SiteHeader activeHref="/galleries" extraNavItems={extraNavItems} />
    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      <header {...stylex.props(styles.header)}>
        <Container width="wide">
          {header?.eyebrow ? (
            <p {...stylex.props(styles.eyebrow)}>{header.eyebrow}</p>
          ) : null}
          <h1 {...stylex.props(styles.heading)}>
            {header?.heading ?? GALLERIES_HERO_TITLE}
          </h1>
          <p {...stylex.props(styles.tagline)}>
            {header?.tagline ?? GALLERIES_HERO_INTRO}
          </p>
          {header?.heroImage ? (
            <div {...stylex.props(styles.heroMedia)}>
              <Media placeholder="" ratio="16:9" source={header.heroImage} />
            </div>
          ) : null}
        </Container>
      </header>

      {/*
        `width="wide"`. This grid of photographs used to sit inside the same
        60ch reading measure as the prose pages, which held each cover image to
        roughly 240px on a laptop regardless of how wide the window was.
      */}
      <Section tone="surface">
        <Container width="wide">
          {galleries.length === 0 ? (
            <p {...stylex.props(styles.empty)}>
              No galleries have been published yet.
            </p>
          ) : (
            <ul {...stylex.props(styles.grid)}>
              {galleries.map((gallery) => (
                <li key={gallery.id}>
                  <a
                    href={`/galleries/${gallery.slug}`}
                    {...stylex.props(styles.card)}
                  >
                    <Media
                      placeholder={gallery.title}
                      ratio="4:3"
                      source={
                        gallery.coverImageUrl
                          ? { src: gallery.coverImageUrl, alt: gallery.title }
                          : undefined
                      }
                      zoom
                    />
                    <h2 {...stylex.props(styles.cardTitle)}>{gallery.title}</h2>
                    {gallery.description ? (
                      <p {...stylex.props(styles.cardDescription)}>
                        {gallery.description}
                      </p>
                    ) : null}
                    <p {...stylex.props(styles.cardCount)}>
                      {gallery.photoCount}{" "}
                      {gallery.photoCount === 1 ? "photo" : "photos"}
                    </p>
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Container>
      </Section>
    </main>
    <SiteFooter />
  </>
);

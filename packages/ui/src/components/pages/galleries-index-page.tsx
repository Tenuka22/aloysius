import * as stylex from "@stylexjs/stylex";

import type { NavItem } from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
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
}

const styles = stylex.create({
  main: {
    display: "block",
    outline: {
      default: null,
      ":focus": "none",
    },
  },
  header: {
    paddingBlockStart: space["3xl"],
    paddingBlockEnd: space.lg,
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
    textWrap: "balance",
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
  empty: {
    margin: 0,
    fontSize: font.sizeSm,
    color: color.onSurfaceMuted,
  },
});

export const GalleriesIndexPage = ({
  galleries,
  extraNavItems,
}: GalleriesIndexPageProps) => (
  <>
    <SiteHeader activeHref="/galleries" extraNavItems={extraNavItems} />
    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      <header {...stylex.props(styles.header)}>
        <p {...stylex.props(styles.eyebrow)}>Photography</p>
        <h1 {...stylex.props(styles.heading)}>Galleries</h1>
        <p {...stylex.props(styles.tagline)}>
          Photographs from around the college, published once a CMS reviewer has
          approved them.
        </p>
      </header>

      <section {...stylex.props(styles.content)}>
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
      </section>
    </main>
    <SiteFooter />
  </>
);

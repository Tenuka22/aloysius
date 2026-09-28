import * as stylex from "@stylexjs/stylex";

import type { NavItem } from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { Media } from "../primitives/media";
import type { ImageSource } from "../primitives/media";
import { SiteFooter } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";

/**
 * One gallery, open to anyone.
 *
 * The page a club's photographs are actually read on. It is deliberately
 * ungated: a gallery only has a row here once a CMS reviewer has approved it, so
 * there is nothing to gate against, and adding a sign-in prompt would be the only
 * thing between a visitor and a school open day.
 *
 * Three things it has to get right, in order of how often they matter:
 *
 * - **The images.** Alt text is required on every item, so a screen reader user
 *   gets the photographer's own description rather than "image".
 * - **The off-site album.** A club's best work is usually too many and too large
 *   to host here, and the link to where the rest lives is often the most useful
 *   thing on the page. It is rendered as a real link with visible text, not an
 *   icon, and it opens in a new tab with `rel="noopener"` because it leaves the
 *   site.
 * - **What this gallery is of.** A gallery linked to an event says so, and links
 *   onward - so a visitor who came for the athletics can find the photographs and
 *   then go back to the event.
 */

const MAIN_ID = "main-content";

/**
 * Stable empty defaults.
 *
 * Not `links = []` inline: a fresh array on every render is a new reference each
 * time, which defeats referential equality on every memoised child below.
 */
const NO_LINKS: readonly GalleryPageLink[] = [];
const NO_DETAILS: readonly { label: string; value: string }[] = [];

export interface GalleryPageItem {
  id: string;
  alt: string;
  caption: string | null;
  imageUrl: string | null;
}

export interface GalleryPageLink {
  targetLabel: string;
  targetTitle: string | null;
  href: string | null;
}

export interface GalleryPageProps {
  title: string;
  summary?: string | null;
  kind: string;
  clubName?: string | null;
  items: readonly GalleryPageItem[];
  albumUrl?: string | null;
  albumLabel?: string | null;
  links?: readonly GalleryPageLink[];
  /** Detail lines shown under the title, e.g. "Shot on 14 March, Colombo". */
  details?: readonly { label: string; value: string }[];
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
  details: {
    display: "flex",
    flexWrap: "wrap",
    justifyContent: "center",
    rowGap: space["2xs"],
    columnGap: space.md,
    margin: 0,
    marginBlockStart: space.sm,
    padding: 0,
    listStyle: "none",
    fontSize: font.sizeSm,
    color: color.onSurfaceMuted,
  },
  detailTerm: {
    fontWeight: font.weightBold,
    color: color.onSurface,
  },
  content: {
    paddingBlock: space.xl,
    paddingInline: space.md,
    maxWidth: space.measure,
    marginInline: "auto",
  },
  /*
   * Masonry via CSS multi-column, for the same reason the homepage gallery uses
   * it: no measurement pass, so every tile's box is reserved by its own
   * aspect-ratio before first paint and CLS stays at 0. Source order is
   * untouched, so the accessibility tree and tab order remain the authored order.
   */
  grid: {
    margin: 0,
    padding: 0,
    listStyle: "none",
    columnGap: space["2xs"],
    columnCount: {
      default: 1,
      [bp.md]: 2,
      [bp.xl]: 3,
    },
  },
  tile: {
    // Without this a tile can be split across a column break, cutting a
    // photograph in half.
    breakInside: "avoid",
    marginBlockEnd: space.xl,
    minWidth: 0,
  },
  caption: {
    marginBlockStart: space["3xs"],
    margin: 0,
    fontSize: font.sizeSm,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
  },
  album: {
    display: "block",
    marginBlockStart: space.lg,
    padding: space.md,
    backgroundColor: color.surface,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
    textAlign: "center",
  },
  albumLabel: {
    display: "block",
    fontSize: font.sizeSm,
    fontWeight: font.weightExtrabold,
    letterSpacing: font.trackingWide,
    color: color.accentOnSurface,
    textDecoration: "underline",
  },
  albumNote: {
    marginBlockStart: space["3xs"],
    margin: 0,
    fontSize: font.sizeXs,
    lineHeight: font.leadingNormal,
    color: color.onSurfaceMuted,
  },
  related: {
    marginBlockStart: space.xl,
    paddingBlockStart: space.md,
    borderTopWidth: space.px,
    borderTopStyle: "solid",
    borderTopColor: color.border,
  },
  relatedHeading: {
    margin: 0,
    marginBlockEnd: space["2xs"],
    fontSize: font.size2xs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWider,
    textTransform: "uppercase",
    color: color.accentOnSurface,
  },
  relatedList: {
    margin: 0,
    padding: 0,
    listStyle: "none",
    display: "grid",
    gap: space["2xs"],
  },
  relatedLink: {
    display: "inline-block",
    minHeight: "2.75rem",
    paddingBlock: space["2xs"],
    fontSize: font.sizeSm,
    color: color.accentOnSurface,
  },
  empty: {
    margin: 0,
    fontSize: font.sizeSm,
    color: color.onSurfaceMuted,
  },
});

export const GalleryPage = ({
  title,
  summary,
  kind,
  clubName,
  items,
  albumUrl,
  albumLabel,
  links = NO_LINKS,
  details = NO_DETAILS,
  extraNavItems,
}: GalleryPageProps) => (
  <>
    <SiteHeader activeHref="/media" extraNavItems={extraNavItems} />
    <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
      <header {...stylex.props(styles.header)}>
        <p {...stylex.props(styles.eyebrow)}>
          {clubName ? `${clubName} · ` : ""}
          {kind} gallery
        </p>
        <h1 {...stylex.props(styles.heading)}>{title}</h1>
        {summary ? <p {...stylex.props(styles.tagline)}>{summary}</p> : null}
        {details.length > 0 ? (
          <ul {...stylex.props(styles.details)}>
            {details.map((detail) => (
              <li key={detail.label}>
                <span {...stylex.props(styles.detailTerm)}>
                  {detail.label}:{" "}
                </span>
                {detail.value}
              </li>
            ))}
          </ul>
        ) : null}
      </header>

      <section {...stylex.props(styles.content)}>
        {/*
         * The album link sits above the images rather than below them. A club's
         * best photographs are frequently the ones it could not upload, so this is
         * the first thing a visitor who cares about the photography should reach -
         * and putting it last would mean scrolling past twenty images they cannot
         * use to find it.
         */}
        {albumUrl ? (
          <div {...stylex.props(styles.album)}>
            <a
              href={albumUrl}
              rel="noopener noreferrer"
              target="_blank"
              {...stylex.props(styles.albumLabel)}
            >
              {albumLabel || "See the full album"}
            </a>
            <p {...stylex.props(styles.albumNote)}>
              More photographs of this, hosted by {clubName ?? "the club"} off
              this site.
            </p>
          </div>
        ) : null}

        {items.length === 0 ? (
          <p {...stylex.props(styles.empty)}>
            No images have been published in this gallery yet.
          </p>
        ) : (
          <ul {...stylex.props(styles.grid)}>
            {items.map((item) => (
              <li key={item.id} {...stylex.props(styles.tile)}>
                <Media
                  placeholder={item.caption || item.alt}
                  ratio="1:1"
                  source={
                    item.imageUrl
                      ? ({ src: item.imageUrl, alt: item.alt } as ImageSource)
                      : undefined
                  }
                  zoom
                />
                {item.caption ? (
                  <p {...stylex.props(styles.caption)}>{item.caption}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {links.length > 0 ? (
          <div {...stylex.props(styles.related)}>
            <h2 {...stylex.props(styles.relatedHeading)}>What this is of</h2>
            <ul {...stylex.props(styles.relatedList)}>
              {links.map((link) =>
                link.href && link.targetTitle ? (
                  <li key={`${link.targetLabel}-${link.href}`}>
                    <a href={link.href} {...stylex.props(styles.relatedLink)}>
                      {link.targetTitle}
                    </a>
                  </li>
                ) : (
                  <li key={`${link.targetLabel}-${link.targetTitle ?? "gone"}`}>
                    <span {...stylex.props(styles.empty)}>
                      {link.targetTitle ??
                        `A ${link.targetLabel} (no longer listed)`}
                    </span>
                  </li>
                )
              )}
            </ul>
          </div>
        ) : null}
      </section>
    </main>
    <SiteFooter />
  </>
);

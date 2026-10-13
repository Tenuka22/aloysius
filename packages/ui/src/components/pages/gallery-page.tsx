import * as stylex from "@stylexjs/stylex";

import type { NavItem } from "../../content/home";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, space } from "../../tokens/tokens.stylex";
import { ArrowLink } from "../primitives/button";
import { Container, Section, SkipLink } from "../primitives/layout";
import { Media } from "../primitives/media";
import type { ImageSource } from "../primitives/media";
import { SiteFooter } from "../site/site-footer";
import type { FooterContact } from "../site/site-footer";
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
  /**
   * The photograph's own width / height. Each tile reserves its true box rather
   * than a shared one, so a portrait and a landscape sit side by side at the
   * same width without either being cropped - which is what makes the masonry
   * read as a wall of photographs rather than a wall of squares.
   */
  aspectRatio?: number;
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
  contact?: FooterContact;
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
  /*
   * A compact left-aligned masthead. It was a centred block at `4xl` with an
   * eyebrow above it; on a page whose entire subject is the photographs, the
   * title was competing with the first image instead of introducing it.
   */
  header: {
    paddingBlock: space["2xl"],
    paddingInline: space.gutter,
    backgroundColor: color.surface,
  },
  title: {
    margin: 0,
    maxInlineSize: "18ch",
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
  details: {
    display: "flex",
    flexWrap: "wrap",
    rowGap: space["2xs"],
    columnGap: space.md,
    margin: 0,
    marginBlockStart: space.md,
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
   *
   * Up to four columns from `xl`, not three: at the old `measure` cap (60ch)
   * three columns gave each photograph roughly 190px. On the wide container this
   * now sits in, three columns gave each tile 300px and a fourth fits without
   * the grid dropping below a readable size on a laptop.
   */
  grid: {
    margin: 0,
    padding: 0,
    listStyle: "none",
    columnGap: space.sm,
    columnCount: {
      default: 1,
      [bp.sm]: 2,
      [bp.lg]: 3,
      [bp.xxl]: 4,
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
  /*
   * The album panel, on the raised ground rather than `surface`.
   *
   * It sat on `color.surface` inside a page that is already `surface`, so the
   * panel was invisible except for its 1px border - it read as a stray rule
   * across the page rather than as something to click.
   */
  album: {
    display: "grid",
    gap: space["3xs"],
    justifyItems: "start",
    marginBlockEnd: space["2xl"],
    padding: space.lg,
    backgroundColor: color.surfaceRaised,
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.border,
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
  contact,
  extraNavItems,
}: GalleryPageProps) => {
  /*
   * The club and the kind folded into the detail line rather than sitting above
   * the title as an eyebrow. Both are facts about the gallery, not a kicker -
   * and an eyebrow above an `h1` is the one thing the house style bans outright.
   */
  const meta: { label: string; value: string }[] = [
    ...(clubName ? [{ label: "Club", value: clubName }] : []),
    { label: "Type", value: `${kind} gallery` },
    { label: "Photographs", value: String(items.length) },
    ...details,
  ];

  return (
    <>
      <SkipLink targetId={MAIN_ID} />
      <SiteHeader activeHref="/media" extraNavItems={extraNavItems} />
      <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
        <header {...stylex.props(styles.header)}>
          <Container width="wide">
            <h1 {...stylex.props(styles.title)}>{title}</h1>
            {summary ? (
              <p {...stylex.props(styles.tagline)}>{summary}</p>
            ) : null}
            <ul {...stylex.props(styles.details)}>
              {meta.map((detail) => (
                <li key={detail.label}>
                  <span {...stylex.props(styles.detailTerm)}>
                    {detail.label}:{" "}
                  </span>
                  {detail.value}
                </li>
              ))}
            </ul>
          </Container>
        </header>

        {/*
          `width="wide"`, not the `measure` cap this page used to sit inside.
          A reading measure of 60ch is right for prose and badly wrong for a
          photographic masonry - it held each tile to about 190px across three
          columns, which is smaller than a phone screen for every photograph on
          the page at once.
        */}
        <Section tone="surface">
          <Container width="wide">
            {/*
              The album link sits above the images rather than below them. A
              club's best photographs are frequently the ones it could not
              upload, so this is the first thing a visitor who cares about the
              photography should reach - and putting it last would mean scrolling
              past twenty images they cannot use to find it.
            */}
            {albumUrl ? (
              <div {...stylex.props(styles.album)}>
                <ArrowLink href={albumUrl} external>
                  {albumLabel || "See the full album"}
                </ArrowLink>
                <p {...stylex.props(styles.albumNote)}>
                  More photographs of this, hosted by {clubName ?? "the club"}{" "}
                  off this site.
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
                      /*
                       * The photograph's own ratio where it is known, `3:2`
                       * where it is not. Either way the box is reserved before
                       * first paint, so nothing shifts as the grid fills.
                       */
                      ratio={item.aspectRatio ?? 1.5}
                      source={
                        item.imageUrl
                          ? ({
                              src: item.imageUrl,
                              alt: item.alt,
                            } as ImageSource)
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
                <h2 {...stylex.props(styles.relatedHeading)}>
                  What this is of
                </h2>
                <ul {...stylex.props(styles.relatedList)}>
                  {links.map((link) =>
                    link.href && link.targetTitle ? (
                      <li key={`${link.targetLabel}-${link.href}`}>
                        <a
                          href={link.href}
                          {...stylex.props(styles.relatedLink)}
                        >
                          {link.targetTitle}
                        </a>
                      </li>
                    ) : (
                      <li
                        key={`${link.targetLabel}-${link.targetTitle ?? "gone"}`}
                      >
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
          </Container>
        </Section>
      </main>
      <SiteFooter contact={contact} />
    </>
  );
};

import * as stylex from "@stylexjs/stylex";
import { useState } from "react";

import type { NavItem } from "../../content/home";
import {
  MEDIA_ALBUMS_PAGE_SIZE,
  MEDIA_PRESS,
  MEDIA_PRESS_EMPTY,
  MEDIA_PRESS_EYEBROW,
  MEDIA_PRESS_HEADING,
  MEDIA_PUBLICATIONS,
  MEDIA_PUBLICATIONS_EMPTY,
  MEDIA_PUBLICATIONS_EYEBROW,
  MEDIA_PUBLICATIONS_HEADING,
  MEDIA_TABS,
  MEDIA_VIDEOS_EMPTY,
  MEDIA_VIDEOS_EYEBROW,
  MEDIA_VIDEOS_HEADING,
} from "../../content/media";
import type { MediaLink } from "../../content/media";
import { bp } from "../../tokens/breakpoints.stylex";
import { color, font, motionToken, space } from "../../tokens/tokens.stylex";
import {
  Container,
  Eyebrow,
  Heading,
  Section,
  SkipLink,
} from "../primitives/layout";
import { Media } from "../primitives/media";
import type { ImageSource } from "../primitives/media";
import { SiteFooter } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";
import { MediaHero } from "./media-hero";

const MAIN_ID = "main-content";
/** Module-level so the default is referentially stable across renders. */
const NO_GALLERIES: readonly MediaGalleryTile[] = [];
const NO_VIDEOS: readonly MediaVideoTile[] = [];

const styles = stylex.create({
  main: {
    display: "block",
    outline: {
      default: null,
      ":focus": "none",
    },
  },
  heroMedia: {
    marginBlockEnd: space.xl,
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
  videoHeader: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: space.md,
    marginBlockEnd: space.xl,
  },
  channelLink: {
    display: "inline-flex",
    alignItems: "center",
    minBlockSize: "2.75rem",
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    color: {
      default: color.accentOnInverse,
      ":hover": color.accentHover,
    },
    textDecoration: "none",
    borderBlockEndWidth: "2px",
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.accent,
  },
  videoList: {
    display: "grid",
    margin: 0,
    padding: 0,
    listStyle: "none",
    gap: space.lg,
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.mdToXl]: "repeat(2, minmax(0, 1fr))",
      [bp.xl]: "repeat(3, minmax(0, 1fr))",
    },
  },
  videoLink: {
    display: "block",
    color: "inherit",
    textDecoration: "none",
  },
  videoThumb: {
    position: "relative",
  },
  playBadge: {
    position: "absolute",
    insetBlockStart: "50%",
    insetInlineStart: "50%",
    transform: "translate(-50%, -50%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    inlineSize: "3.5rem",
    blockSize: "3.5rem",
    borderRadius: "50%",
    backgroundColor: color.accent,
    color: color.onAccent,
    pointerEvents: "none",
  },
  videoTitle: {
    margin: 0,
    marginBlockStart: space.sm,
    fontSize: font.sizeLg,
    fontWeight: font.weightBold,
    lineHeight: font.leadingSnug,
    color: color.onInverse,
  },
  videoMeta: {
    margin: 0,
    marginBlockStart: space["3xs"],
    fontSize: font.sizeXs,
    color: color.onInverseSubtle,
  },
  tabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: space.xs,
    marginBlockStart: space.xl,
  },
  tab: {
    display: "inline-flex",
    alignItems: "center",
    minBlockSize: "2.75rem",
    paddingInline: space.md,
    borderWidth: space.px,
    borderStyle: "solid",
    fontSize: font.sizeXs,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    textDecoration: "none",
    textTransform: "uppercase",
    transitionProperty: "background-color, color, border-color",
    transitionDuration: motionToken.fast,
  },
  tabIdle: {
    backgroundColor: {
      default: "transparent",
      ":hover": "rgba(255, 178, 3, 0.14)",
    },
    borderColor: color.borderAccent,
    color: color.accentOnInverse,
  },
  tabActive: {
    backgroundColor: color.accent,
    borderColor: color.accent,
    color: color.onAccent,
  },
  loadMore: {
    display: "flex",
    justifyContent: "center",
    marginBlockStart: space["2xl"],
  },
  loadMoreButton: {
    minBlockSize: "2.75rem",
    paddingInline: space.xl,
    backgroundColor: {
      default: "transparent",
      ":hover": color.surfaceInverse,
    },
    borderWidth: space.px,
    borderStyle: "solid",
    borderColor: color.surfaceInverse,
    color: {
      default: color.onSurface,
      ":hover": color.accentOnInverse,
    },
    fontSize: font.sizeSm,
    fontWeight: font.weightBold,
    letterSpacing: font.trackingWide,
    textTransform: "uppercase",
    cursor: "pointer",
    transitionProperty: "background-color, color",
    transitionDuration: motionToken.fast,
  },
  linkList: {
    margin: 0,
    marginBlockStart: space.xl,
    padding: 0,
    listStyle: "none",
    borderBlockStartWidth: space.px,
    borderBlockStartStyle: "solid",
    borderBlockStartColor: color.borderStrong,
  },
  linkRow: {
    borderBlockEndWidth: space.px,
    borderBlockEndStyle: "solid",
    borderBlockEndColor: color.borderStrong,
  },
  linkAnchor: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: space.xs,
    paddingBlock: space.md,
    color: {
      default: color.onSurface,
      ":hover": color.accentOnSurface,
    },
    textDecoration: "none",
  },
  linkTitle: {
    fontFamily: font.display,
    fontSize: font.sizeXl,
    fontWeight: font.weightSemibold,
    lineHeight: font.leadingSnug,
  },
  linkMeta: {
    fontSize: font.sizeXs,
    color: color.onSurfaceMuted,
  },
  emptyBlock: {
    margin: 0,
    marginBlockStart: space.xl,
    paddingBlock: space["2xl"],
    paddingInline: space.lg,
    borderWidth: space.px,
    borderStyle: "dashed",
    borderColor: color.borderStrong,
    textAlign: "center",
    fontSize: font.sizeMd,
    color: color.onSurfaceMuted,
  },
  emptyBlockInverse: {
    borderColor: color.borderInverse,
    color: color.onInverseMuted,
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
  /**
   * Videos for the "College on Film" strip. Empty, the section does not render:
   * the CMS has no video source yet, and the design's titles were placeholders.
   */
  videos?: readonly MediaVideoTile[];
  /** Defaults to `MEDIA_PUBLICATIONS` in `content/media.ts`. */
  publications?: readonly MediaLink[];
  /** Defaults to `MEDIA_PRESS` in `content/media.ts`. */
  press?: readonly MediaLink[];
  /** The College's channel; the strip's header link is omitted without it. */
  channelUrl?: string;
  extraNavItems?: readonly NavItem[];
}

export interface MediaVideoTile {
  id: string;
  title: string;
  href: string;
  thumbnail: ImageSource;
  /** Duration and date, e.g. "4:12 • 12 March 2026". */
  meta?: string;
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
  "plain",
  "plain",
  "plain",
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

const LinkSection = ({
  id,
  eyebrow,
  heading,
  empty,
  items,
}: {
  id: string;
  eyebrow: string;
  heading: string;
  empty: string;
  items: readonly MediaLink[];
}) => (
  <Section id={id} labelledBy={`${id}-title`} tone="surface">
    <Container>
      <Eyebrow>{eyebrow}</Eyebrow>
      <Heading id={`${id}-title`} level={2}>
        {heading}
      </Heading>
      {items.length > 0 ? (
        <ul {...stylex.props(styles.linkList)}>
          {items.map((item) => (
            <li key={item.id} {...stylex.props(styles.linkRow)}>
              <a href={item.href} {...stylex.props(styles.linkAnchor)}>
                <span {...stylex.props(styles.linkTitle)}>{item.title}</span>
                {item.meta ? (
                  <span {...stylex.props(styles.linkMeta)}>{item.meta}</span>
                ) : null}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p {...stylex.props(styles.emptyBlock)}>{empty}</p>
      )}
    </Container>
  </Section>
);

export const MediaPage = ({
  channelUrl,
  heading,
  tagline,
  heroImage,
  galleries = NO_GALLERIES,
  videos = NO_VIDEOS,
  publications = MEDIA_PUBLICATIONS,
  press = MEDIA_PRESS,
  extraNavItems,
}: MediaPageProps) => {
  const [activeTab, setActiveTab] = useState<string>(MEDIA_TABS[0].id);
  const [shown, setShown] = useState(MEDIA_ALBUMS_PAGE_SIZE);
  const visibleGalleries = galleries.slice(0, shown);

  return (
    <>
      <SkipLink targetId={MAIN_ID} />
      <SiteHeader activeHref="/media" extraNavItems={extraNavItems} />
      <main id={MAIN_ID} tabIndex={-1} {...stylex.props(styles.main)}>
        <MediaHero intro={tagline} title={heading}>
          {/*
            The tabs jump to the section they name, so every part of the page
            stays reachable without scripting - the highlight is a convenience.
          */}
          <nav aria-label="Media sections" {...stylex.props(styles.tabs)}>
            {MEDIA_TABS.map((tab) => (
              <a
                aria-current={activeTab === tab.id ? "true" : undefined}
                href={`#${tab.id}`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                {...stylex.props(
                  styles.tab,
                  activeTab === tab.id ? styles.tabActive : styles.tabIdle
                )}
              >
                {tab.label}
              </a>
            ))}
          </nav>
        </MediaHero>

        <section
          aria-labelledby="photos-title"
          id="photos"
          {...stylex.props(styles.content)}
        >
          <Container width="wide">
            {heroImage && (
              <Media
                placeholder=""
                ratio="16:9"
                source={heroImage}
                style={styles.heroMedia}
              />
            )}
            <h2 id="photos-title" {...stylex.props(styles.sectionHeading)}>
              Photographs
            </h2>
            {galleries.length === 0 ? (
              <p {...stylex.props(styles.emptyBlock)}>
                No galleries have been published yet. Approved galleries appear
                here as soon as the CMS team reviews them.
              </p>
            ) : (
              <ul {...stylex.props(styles.galleryList)}>
                {visibleGalleries.map((gallery, index) => {
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
            {shown < galleries.length ? (
              <div {...stylex.props(styles.loadMore)}>
                <button
                  onClick={() =>
                    setShown((count) => count + MEDIA_ALBUMS_PAGE_SIZE)
                  }
                  type="button"
                  {...stylex.props(styles.loadMoreButton)}
                >
                  Load more albums
                </button>
              </div>
            ) : null}
          </Container>
        </section>

        <Section id="videos" labelledBy="videos-title" tone="inverseGradient">
          <Container>
            <div {...stylex.props(styles.videoHeader)}>
              <div>
                <Eyebrow inverse>{MEDIA_VIDEOS_EYEBROW}</Eyebrow>
                <Heading id="videos-title" level={2}>
                  {MEDIA_VIDEOS_HEADING}
                </Heading>
              </div>
              {channelUrl && (
                <a
                  href={channelUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                  {...stylex.props(styles.channelLink)}
                >
                  YouTube Channel &rarr;
                </a>
              )}
            </div>
            {videos.length > 0 ? (
              <ul {...stylex.props(styles.videoList)}>
                {videos.map((video) => (
                  <li key={video.id}>
                    <a href={video.href} {...stylex.props(styles.videoLink)}>
                      <div {...stylex.props(styles.videoThumb)}>
                        <Media
                          placeholder="Video thumbnail"
                          ratio="16:9"
                          source={video.thumbnail}
                        />
                        <span
                          aria-hidden="true"
                          {...stylex.props(styles.playBadge)}
                        >
                          &#9654;
                        </span>
                      </div>
                      <h3 {...stylex.props(styles.videoTitle)}>
                        {video.title}
                      </h3>
                      {video.meta && (
                        <p {...stylex.props(styles.videoMeta)}>{video.meta}</p>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p {...stylex.props(styles.emptyBlock, styles.emptyBlockInverse)}>
                {MEDIA_VIDEOS_EMPTY}
              </p>
            )}
          </Container>
        </Section>

        <LinkSection
          empty={MEDIA_PUBLICATIONS_EMPTY}
          eyebrow={MEDIA_PUBLICATIONS_EYEBROW}
          heading={MEDIA_PUBLICATIONS_HEADING}
          id="publications"
          items={publications}
        />
        <LinkSection
          empty={MEDIA_PRESS_EMPTY}
          eyebrow={MEDIA_PRESS_EYEBROW}
          heading={MEDIA_PRESS_HEADING}
          id="press"
          items={press}
        />
      </main>
      <SiteFooter />
    </>
  );
};

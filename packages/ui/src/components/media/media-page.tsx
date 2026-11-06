import * as stylex from "@stylexjs/stylex";
import { useState } from "react";

import type { NavItem } from "../../content/home";
import {
  MEDIA_ALBUMS_PAGE_SIZE,
  MEDIA_HERO_TITLE,
  MEDIA_TABS,
  MEDIA_VIDEOS_EMPTY,
  MEDIA_VIDEOS_EYEBROW,
  MEDIA_VIDEOS_HEADING,
} from "../../content/media";
import { bp } from "../../tokens/breakpoints.stylex";
import { font } from "../../tokens/tokens.stylex";
import { DcEyebrow, DcHeading, DcInner, DcSection } from "../home/dc";
import { SkipLink, VisuallyHidden } from "../primitives/layout";
import { Media } from "../primitives/media";
import type { ImageSource } from "../primitives/media";
import { PageHero } from "../site/page-hero";
import { SiteFooter } from "../site/site-footer";
import { SiteHeader } from "../site/site-header";

const MAIN_ID = "main-content";
/** Module-level so the default is referentially stable across renders. */
const NO_GALLERIES: readonly MediaGalleryTile[] = [];
const NO_VIDEOS: readonly MediaVideoTile[] = [];

/*
 * Measurements are the approved design's (Media.dc.html): a 90px photo section
 * with a four-column mosaic on 170px rows and 14px gaps, then a 110px video
 * section with three 200px thumbnails.
 */
const styles = stylex.create({
  main: {
    display: "block",
    outline: {
      default: null,
      ":focus": "none",
    },
  },
  tabs: {
    display: "flex",
    flexWrap: "wrap",
    gap: "12px",
  },
  tab: {
    display: "inline-flex",
    alignItems: "center",
    paddingBlock: "9px",
    paddingInline: "18px",
    borderWidth: "1px",
    borderStyle: "solid",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.1em",
    textDecoration: "none",
    textTransform: "uppercase",
  },
  tabIdle: {
    backgroundColor: {
      default: "transparent",
      ":hover": "rgba(255, 178, 3, 0.14)",
    },
    borderColor: "rgba(255, 178, 3, 0.4)",
    color: "#FFB203",
  },
  tabActive: {
    backgroundColor: "#FFB203",
    borderColor: "#FFB203",
    color: "#013405",
  },

  photos: {
    paddingBlock: "clamp(56px, 8vw, 90px)",
  },
  /*
   * Every gallery cover is cropped to a square at upload time, so there is no
   * real per-photo aspect ratio to lay a true masonry from. The rhythm comes
   * from deliberate spans instead: a repeating 8-tile cycle (one 2x2 feature,
   * six singles, one wide banner), exactly as the design lays out its eight
   * albums. The pattern repeats by `index % 8`, so it holds for any count.
   * Two columns on a phone, four from 64rem.
   */
  mosaic: {
    display: "grid",
    margin: 0,
    padding: 0,
    listStyle: "none",
    gap: "14px",
    gridTemplateColumns: {
      default: "repeat(2, minmax(0, 1fr))",
      [bp.xl]: "repeat(4, minmax(0, 1fr))",
    },
    gridAutoRows: {
      default: "150px",
      [bp.xl]: "170px",
    },
  },
  tile: {
    position: "relative",
    minWidth: 0,
    overflow: "hidden",
  },
  spanFeature: {
    gridColumn: "span 2",
    gridRow: "span 2",
  },
  spanWide: {
    gridColumn: "span 2",
  },
  tileLink: {
    display: "block",
    position: "relative",
    inlineSize: "100%",
    blockSize: "100%",
    color: "inherit",
    textDecoration: "none",
  },
  tilePhoto: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
  },
  srOnly: {
    position: "absolute",
    width: "1px",
    height: "1px",
    margin: "-1px",
    padding: 0,
    overflow: "hidden",
    clipPath: "inset(50%)",
    whiteSpace: "nowrap",
    borderWidth: 0,
  },
  empty: {
    margin: 0,
    paddingBlock: "64px",
    paddingInline: "24px",
    borderWidth: "1px",
    borderStyle: "dashed",
    borderColor: "rgba(1, 52, 5, 0.15)",
    textAlign: "center",
    fontSize: "15px",
    color: "rgba(1, 52, 5, 0.75)",
  },
  emptyInverse: {
    borderColor: "rgba(255, 248, 231, 0.2)",
    color: "rgba(255, 248, 231, 0.75)",
  },
  loadMore: {
    display: "flex",
    justifyContent: "center",
    marginBlockStart: "clamp(40px, 6vw, 60px)",
  },
  loadMoreButton: {
    paddingBlock: "14px",
    paddingInline: "34px",
    backgroundColor: {
      default: "transparent",
      ":hover": "#013405",
    },
    borderWidth: "1px",
    borderStyle: "solid",
    borderColor: "#013405",
    color: {
      default: "#013405",
      ":hover": "#FFB203",
    },
    font: "inherit",
    fontSize: "13px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    cursor: "pointer",
  },

  videos: {
    paddingBlock: "clamp(56px, 9vw, 110px)",
  },
  videoHeader: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: "24px",
    marginBlockEnd: "clamp(36px, 5vw, 56px)",
  },
  videoHeading: {
    fontSize: "clamp(34px, 4.2vw, 50px)",
    lineHeight: 1.1,
  },
  channelLink: {
    paddingBlockEnd: "6px",
    borderBlockEndWidth: "2px",
    borderBlockEndStyle: "solid",
    borderBlockEndColor: "#FFB203",
    color: {
      default: "#FFB203",
      ":hover": "#FFD45A",
    },
    fontSize: "14px",
    fontWeight: 700,
    textDecoration: "none",
    whiteSpace: "nowrap",
  },
  videoList: {
    display: "grid",
    margin: 0,
    padding: 0,
    listStyle: "none",
    gap: "28px",
    gridTemplateColumns: {
      default: "minmax(0, 1fr)",
      [bp.md]: "repeat(2, minmax(0, 1fr))",
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
    height: "200px",
    overflow: "hidden",
  },
  playBadge: {
    position: "absolute",
    insetBlockStart: "50%",
    insetInlineStart: "50%",
    transform: "translate(-50%, -50%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    inlineSize: "56px",
    blockSize: "56px",
    borderRadius: "50%",
    backgroundColor: "rgba(255, 178, 3, 0.92)",
    color: "#013405",
    fontSize: "18px",
    pointerEvents: "none",
  },
  videoTitle: {
    margin: 0,
    marginBlock: "16px 4px",
    fontFamily: font.body,
    fontWeight: 700,
    fontSize: "16px",
  },
  videoMeta: {
    margin: 0,
    fontSize: "12px",
    color: "rgba(255, 248, 231, 0.55)",
    fontFamily: "ui-monospace, monospace",
  },
});

export interface MediaVideoTile {
  id: string;
  title: string;
  href: string;
  thumbnail?: ImageSource;
  /** Duration and date, e.g. "4:12 • 12 March 2026". */
  meta?: string;
}

export interface MediaGalleryTile {
  id: string;
  title: string;
  href: string;
  image: ImageSource;
}

export interface MediaPageProps {
  heading?: string;
  /**
   * One tile per approved gallery, in the order they should appear.
   */
  galleries?: readonly MediaGalleryTile[];
  /**
   * Videos for the "College on Film" section. The CMS has no video source yet,
   * so until one exists the section shows its empty state.
   */
  videos?: readonly MediaVideoTile[];
  /** The College's channel; the section's header link is omitted without it. */
  channelUrl?: string;
  extraNavItems?: readonly NavItem[];
}

/** `index % 8` picks a span for each tile; see `mosaic`'s comment. */
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
  wide: styles.spanWide,
} as const;

export const MediaPage = ({
  channelUrl,
  heading = MEDIA_HERO_TITLE,
  galleries = NO_GALLERIES,
  videos = NO_VIDEOS,
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
        <PageHero
          actions={
            /*
             * The tabs jump to the section they name, so every part of the
             * page stays reachable without scripting - the highlight is a
             * convenience.
             */
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
          }
          compact
          crumb="Media"
          title={heading}
          titleId="media-hero-title"
        />

        <DcSection
          id="photos"
          labelledBy="photos-title"
          style={styles.photos}
          tone="cream"
        >
          <DcInner>
            <h2 id="photos-title" {...stylex.props(styles.srOnly)}>
              Photographs
            </h2>
            {galleries.length === 0 ? (
              <p {...stylex.props(styles.empty)}>
                No galleries have been published yet. Approved galleries appear
                here as soon as the CMS team reviews them.
              </p>
            ) : (
              <ul {...stylex.props(styles.mosaic)}>
                {visibleGalleries.map((gallery, index) => {
                  const span =
                    MOSAIC_PATTERN[index % MOSAIC_PATTERN.length] ?? "plain";
                  return (
                    <li
                      key={gallery.id}
                      {...stylex.props(styles.tile, MOSAIC_SPAN_STYLES[span])}
                    >
                      <a href={gallery.href} {...stylex.props(styles.tileLink)}>
                        <Media
                          fill
                          placeholder=""
                          source={gallery.image}
                          style={styles.tilePhoto}
                          zoom
                        />
                        {/* The design shows the photograph alone; the title
                            still names the link for screen readers. */}
                        <VisuallyHidden>{gallery.title}</VisuallyHidden>
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
          </DcInner>
        </DcSection>

        <DcSection
          id="videos"
          labelledBy="videos-title"
          style={styles.videos}
          tone="greenGradient"
        >
          <DcInner>
            <div {...stylex.props(styles.videoHeader)}>
              <div>
                <DcEyebrow gold>{MEDIA_VIDEOS_EYEBROW}</DcEyebrow>
                <DcHeading id="videos-title" style={styles.videoHeading}>
                  {MEDIA_VIDEOS_HEADING}
                </DcHeading>
              </div>
              {channelUrl ? (
                <a
                  href={channelUrl}
                  rel="noopener noreferrer"
                  target="_blank"
                  {...stylex.props(styles.channelLink)}
                >
                  YouTube Channel &rarr;
                </a>
              ) : null}
            </div>
            {videos.length > 0 ? (
              <ul {...stylex.props(styles.videoList)}>
                {videos.map((video) => (
                  <li key={video.id}>
                    <a href={video.href} {...stylex.props(styles.videoLink)}>
                      <div {...stylex.props(styles.videoThumb)}>
                        <Media
                          fill
                          inverse
                          placeholder="Video thumbnail"
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
                      {video.meta ? (
                        <p {...stylex.props(styles.videoMeta)}>{video.meta}</p>
                      ) : null}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p {...stylex.props(styles.empty, styles.emptyInverse)}>
                {MEDIA_VIDEOS_EMPTY}
              </p>
            )}
          </DcInner>
        </DcSection>
      </main>
      <SiteFooter />
    </>
  );
};
